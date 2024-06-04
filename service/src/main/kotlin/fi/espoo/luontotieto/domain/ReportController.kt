// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.EmailContent
import fi.espoo.luontotieto.common.Emails
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.BucketEnv
import fi.espoo.luontotieto.config.EmailEnv
import fi.espoo.luontotieto.config.LuontotietoHost
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.s3.MultipartDocument
import fi.espoo.luontotieto.s3.S3DocumentService
import fi.espoo.luontotieto.s3.checkFileContentType
import fi.espoo.luontotieto.s3.getAndCheckFileName
import fi.espoo.luontotieto.ses.Email
import fi.espoo.luontotieto.ses.SESEmailClient
import fi.espoo.paikkatieto.domain.TableDefinition
import fi.espoo.paikkatieto.domain.getEnumRange
import fi.espoo.paikkatieto.domain.insertPaikkatieto
import fi.espoo.paikkatieto.reader.GpkgReader
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.writer.GpkgWriter
import jakarta.servlet.http.HttpServletResponse
import mu.KotlinLogging
import org.apache.commons.io.IOUtils
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.net.URL
import java.nio.file.Files
import java.util.UUID

@RestController
@RequestMapping("/reports")
class ReportController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    @Qualifier("jdbi-paikkatieto")
    @Autowired
    lateinit var paikkatietoJdbi: Jdbi

    @Autowired lateinit var documentClient: S3DocumentService

    @Autowired lateinit var sesEmailClient: SESEmailClient

    @Autowired lateinit var bucketEnv: BucketEnv

    @Autowired lateinit var luontotietoHost: LuontotietoHost

    @Autowired lateinit var emailEnv: EmailEnv

    private val logger = KotlinLogging.logger {}

    @PostMapping("/{reportId}/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadReportFile(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("description") description: String?,
        @RequestParam("documentType") documentType: DocumentType
    ): ResponseEntity<List<GpkgValidationError>> {
        val dataBucket = bucketEnv.data

        val fileName = getAndCheckFileName(file)
        val contentType = file.inputStream.use { stream -> checkFileContentType(stream) }

        val tableDefinition = documentType.tableDefinition

        val errors =
            tableDefinition?.let { td ->
                val tmpGpkgFile = kotlin.io.path.createTempFile(fileName)
                file.transferTo(tmpGpkgFile)
                GpkgReader(File(tmpGpkgFile.toUri()), td).use { reader ->
                    reader.asSequence().flatMap { it.errors }.toList()
                }
            } ?: emptyList()

        if (errors.isEmpty()) {
            val id =
                jdbi.inTransactionUnchecked { tx ->
                    // Check that user has permission to report
                    val report = tx.getReport(reportId, user)
                    tx.insertReportFile(
                        ReportFileInput(
                            report.id,
                            description,
                            contentType,
                            fileName,
                            documentType
                        ),
                        user
                    )
                }

            try {
                documentClient.upload(
                    dataBucket,
                    MultipartDocument(
                        name = "$reportId/$id",
                        file = file,
                        contentType = contentType
                    )
                )
                logger.audit(
                    user,
                    AuditEvent.ADD_REPORT_FILE,
                    mapOf("id" to "$reportId", "file" to "$id")
                )
                return ResponseEntity.status(HttpStatus.CREATED).body(errors)
            } catch (e: Exception) {
                logger.error("Error uploading file: ", e)
                jdbi.inTransactionUnchecked { tx -> tx.deleteReportFile(reportId, id) }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errors)
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors)
    }

    @GetMapping("/{id}")
    fun getReportById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ) = jdbi.inTransactionUnchecked { tx -> tx.getReport(id, user) }

    @GetMapping()
    fun getReports(user: AuthenticatedUser) = jdbi.inTransactionUnchecked { tx -> tx.getReports(user) }

    @PutMapping("/{id}")
    fun updateReport(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody report: Report.Companion.ReportInput
    ): Report {
        val reportResponse =
            jdbi
                .inTransactionUnchecked { tx -> tx.putReport(id, report, user) }
                .also { logger.audit(user, AuditEvent.UPDATE_REPORT, mapOf("id" to "$id")) }

        if (emailEnv.enabled) {
            val reportApprovedEmail =
                Emails.getReportUpdatedEmail(
                    reportResponse.name,
                    reportResponse.order?.assignee ?: "",
                    luontotietoHost.getReportUrl(reportResponse.id)
                )
            sendReportEmails(reportApprovedEmail, reportResponse)
        }
        return reportResponse
    }

    @PostMapping("/{reportId}/approve")
    @ResponseStatus(HttpStatus.CREATED)
    fun approveReport(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
    ) {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        val dataBucket = bucketEnv.data

        val reportFiles =
            jdbi.inTransactionUnchecked { tx ->
                tx.getPaikkaTietoReportFiles(
                    reportId,
                )
            }

        val report = jdbi.inTransactionUnchecked { tx -> tx.getReport(reportId, user) }

        val readers =
            reportFiles.mapNotNull { rf ->
                getPaikkatietoReader(dataBucket, "$reportId/${rf.id}", rf)
            }
        paikkatietoJdbi.inTransactionUnchecked { ptx ->
            readers.forEach {
                it.use { reader ->
                    val params =
                        when (reader.tableDefinition) {
                            TableDefinition.ALUERAJAUS_LUONTOSELVITYS -> {
                                jdbi.inTransactionUnchecked { tx ->
                                    tx.getAluerajausLuontoselvitysParams(
                                        user,
                                        reportId,
                                        luontotietoHost.getReportDocumentDownloadUrl(reportId)
                                    )
                                }
                            }
                            else -> emptyMap()
                        }
                    ptx.insertPaikkatieto(
                        reader.tableDefinition,
                        report,
                        reader.asSequence(),
                        params
                    )
                }
            }
        }

        jdbi
            .inTransactionUnchecked { tx -> tx.approveReport(reportId, user) }
            .also { logger.audit(user, AuditEvent.APPROVE_REPORT, mapOf("id" to "$reportId")) }

        if (emailEnv.enabled) {
            val report = jdbi.inTransactionUnchecked { tx -> tx.getReport(reportId, user) }
            val userResponse = jdbi.inTransactionUnchecked { tx -> tx.getUser(user.id) }
            val reportApprovedEmail =
                Emails.getReportApprovedEmail(
                    report.name,
                    userResponse.name,
                    luontotietoHost.getReportUrl(report.id)
                )
            sendReportEmails(reportApprovedEmail, report)
        }
    }

    @GetMapping("/{reportId}/files")
    fun getReportFiles(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID
    ): List<ReportFile> {
        return jdbi.inTransactionUnchecked { tx ->
            // This is done to check that user has access to the report
            val report = tx.getReport(reportId, user)
            tx.getReportFiles(reportId)
        }
    }

    @GetMapping("/{reportId}/files/{fileId}")
    fun getReportFileById(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
        @PathVariable fileId: UUID
    ): URL {
        val dataBucket = bucketEnv.data

        val reportFile =
            jdbi.inTransactionUnchecked { tx -> tx.getReportFileById(reportId, fileId) }
        val contentDisposition =
            ContentDisposition.attachment().filename(reportFile.fileName).build()
        val fileUrl =
            documentClient.presignedGetUrl(dataBucket, "$reportId/$fileId", contentDisposition)
        return fileUrl
    }

    @GetMapping("/{reportId}/files/report")
    fun getReportFileById(
        @PathVariable reportId: UUID,
        response: HttpServletResponse
    ) {
        val dataBucket = bucketEnv.data

        val reportFile =
            jdbi.inTransactionUnchecked { tx -> tx.getReportDocumentForReport(reportId) }

        val contentDisposition =
            ContentDisposition.attachment().filename(reportFile.fileName).build()

        val res =
            documentClient.download(dataBucket, "$reportId/${reportFile.id}", contentDisposition)
        res.use {
            response.contentType = res.response().contentType()
            response.setHeader("Content-Disposition", contentDisposition.toString())
            response.setContentLength(res.response().contentLength().toInt())
            IOUtils.copy(it, response.outputStream)
            response.outputStream.flush()
        }
    }

    @DeleteMapping("/{reportId}/files/{fileId}")
    fun deleteReportFile(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
        @PathVariable fileId: UUID
    ) {
        val dataBucket = bucketEnv.data

        documentClient.delete(dataBucket, "$reportId/$fileId")

        jdbi
            .inTransactionUnchecked { tx -> tx.deleteReportFile(reportId, fileId) }
            .also {
                logger.audit(
                    user,
                    AuditEvent.DELETE_REPORT_FILE,
                    mapOf("id" to "$reportId", "file" to "$fileId")
                )
            }
    }

    @GetMapping("/template/{documentType}.gpkg")
    fun getGpkgTemplate(
        @PathVariable documentType: DocumentType
    ): ResponseEntity<Resource> {
        val tableDefinition = documentType.tableDefinition ?: throw NotFound()
        val file =
            GpkgWriter.write(tableDefinition) { column ->
                paikkatietoJdbi.inTransactionUnchecked { tx -> tx.getEnumRange(column) }
            }
                ?.takeIf { Files.size(it) > 0 } ?: throw NotFound()

        val resource = UrlResource(file.toUri())

        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"${tableDefinition.layerName}.gpkg\""
            )
            .header(HttpHeaders.CONTENT_TYPE, "application/geopackage+sqlite3")
            .body(resource)
    }

    private fun sendReportEmails(
        email: EmailContent,
        report: Report
    ) {
        try {
            jdbi.inTransactionUnchecked { tx ->
                val emails = mutableListOf<String?>()
                if (report.order !== null) {
                    val assigneeUser = tx.getUser(report.order.assigneeId)
                    emails.add(assigneeUser.email)
                    emails.add(report.order.contactEmail)
                    emails.add(report.order.assigneeContactEmail)
                }
                emails.filterNotNull().distinct().forEach { e ->
                    sesEmailClient.send(Email(e, email))
                }
            }
        } catch (e: Exception) {
            logger.error("Error sending email: ", e)
        }
    }

    private fun getPaikkatietoReader(
        bucketName: String,
        fileName: String,
        reportFile: ReportFile
    ): GpkgReader? {
        val tableDefinition = reportFile.documentType.tableDefinition ?: return null

        val document = documentClient.get(bucketName, fileName)

        val file = File.createTempFile(reportFile.fileName, "gpkg")
        file.writeBytes(document.bytes)

        val reader = GpkgReader(file, tableDefinition)

        return reader
    }
}
