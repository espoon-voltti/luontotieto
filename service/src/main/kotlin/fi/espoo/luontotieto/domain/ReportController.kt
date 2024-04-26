package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.BucketEnv
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.s3.Document
import fi.espoo.luontotieto.s3.S3DocumentService
import fi.espoo.luontotieto.s3.checkFileContentType
import fi.espoo.luontotieto.s3.getAndCheckFileName
import fi.espoo.paikkatieto.domain.TableDefinition
import fi.espoo.paikkatieto.domain.getEnumRange
import fi.espoo.paikkatieto.domain.insertLiitoOravaAlueet
import fi.espoo.paikkatieto.domain.insertLiitoOravaPisteet
import fi.espoo.paikkatieto.domain.insertLiitoOravaYhteysviivat
import fi.espoo.paikkatieto.reader.GpkgReader
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.writer.GpkgWriter
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
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

    @Autowired
    lateinit var documentClient: S3DocumentService

    @Autowired
    lateinit var bucketEnv: BucketEnv

    private val logger = KotlinLogging.logger {}

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createReportFromScratch(
        user: AuthenticatedUser,
        @RequestBody body: Report.Companion.ReportInput
    ): Report {
        return jdbi
            .inTransactionUnchecked { tx -> tx.insertReport(data = body, user = user) }
            .also { logger.audit(user, AuditEvent.CREATE_REPORT, mapOf("id" to "$it")) }
    }

    @PostMapping("/{reportId}/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadReportFile(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("description") description: String,
        @RequestParam("documentType") documentType: DocumentType
    ): ResponseEntity<List<GpkgValidationError>> {
        val dataBucket = bucketEnv.data

        val fileName = getAndCheckFileName(file)
        val contentType = file.inputStream.use { stream -> checkFileContentType(stream) }

        val tableDefinition = getTableDefinitionByDocumentType(documentType)

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
                    tx.insertReportFile(
                        ReportFileInput(reportId, description, contentType, fileName, documentType),
                        user
                    )
                }

            try {
                documentClient.upload(
                    dataBucket,
                    Document(name = "$reportId/$id", bytes = file.bytes, contentType = contentType)
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
    ): Report {
        return jdbi.inTransactionUnchecked { tx -> tx.getReport(id, user) }
    }

    @GetMapping()
    fun getReports(user: AuthenticatedUser): List<Report> {
        return jdbi.inTransactionUnchecked { tx -> tx.getReports(user) }
    }

    @PutMapping("/{id}")
    fun updateReport(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody report: Report.Companion.ReportInput
    ): Report {
        return jdbi
            .inTransactionUnchecked { tx -> tx.putReport(id, report, user) }
            .also { logger.audit(user, AuditEvent.UPDATE_REPORT, mapOf("id" to "$id")) }
    }

    @PostMapping("/{reportId}/approve")
    @ResponseStatus(HttpStatus.CREATED)
    fun approveReport(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
    ) {
        val dataBucket = bucketEnv.data

        val reportFiles =
            jdbi.inTransactionUnchecked { tx ->
                tx.getPaikkaTietoReportFiles(
                    reportId,
                )
            }

        val readers =
            reportFiles.mapNotNull { rf ->
                getPaikkatietoReader(dataBucket, "$reportId/${rf.id}", rf)
            }

        paikkatietoJdbi.inTransactionUnchecked { tx ->
            readers.forEach {
                it.use { reader ->
                    when (reader.tableDefinition) {
                        TableDefinition.LiitoOravaPisteet ->
                            tx.insertLiitoOravaPisteet(reportId, reader.asSequence())
                        TableDefinition.LiitoOravaAlueet ->
                            tx.insertLiitoOravaAlueet(reportId, reader.asSequence())
                        TableDefinition.LiitoOravaYhteysviivat ->
                            tx.insertLiitoOravaYhteysviivat(reportId, reader.asSequence())
                    }
                }
            }
        }

        jdbi
            .inTransactionUnchecked { tx -> tx.approveReport(reportId, user) }
            .also { logger.audit(user, AuditEvent.APPROVE_REPORT, mapOf("id" to "$reportId")) }
    }

    @GetMapping("/{reportId}/files")
    fun getReportFiles(
        @PathVariable reportId: UUID
    ): List<ReportFile> {
        return jdbi.inTransactionUnchecked { tx -> tx.getReportFiles(reportId) }
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
        val tableDefinition = getTableDefinitionByDocumentType(documentType) ?: throw NotFound()
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

    private fun getPaikkatietoReader(
        bucketName: String,
        fileName: String,
        reportFile: ReportFile
    ): GpkgReader? {
        val tableDefinition =
            getTableDefinitionByDocumentType(reportFile.documentType) ?: return null

        val document = documentClient.get(bucketName, fileName)

        val file = File.createTempFile(reportFile.fileName, "gpkg")
        file.writeBytes(document.bytes)

        val reader = GpkgReader(file, tableDefinition)

        return reader
    }
}
