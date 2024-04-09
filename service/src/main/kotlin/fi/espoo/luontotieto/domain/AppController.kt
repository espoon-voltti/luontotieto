// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.BucketEnv
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.s3.Document
import fi.espoo.luontotieto.s3.S3DocumentService
import fi.espoo.luontotieto.s3.checkFileContentType
import fi.espoo.paikkatieto.domain.LiitoOravaAlueet
import fi.espoo.paikkatieto.domain.LiitoOravaPisteet
import fi.espoo.paikkatieto.domain.LiitoOravaYhteysviivat
import fi.espoo.paikkatieto.domain.insertLiitoOravaAlueet
import fi.espoo.paikkatieto.domain.insertLiitoOravaPisteet
import fi.espoo.paikkatieto.domain.insertLiitoOravaYhteysviivat
import fi.espoo.paikkatieto.reader.GpkgReader
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.util.UUID

@RestController
class AppController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    @Qualifier("jdbi-paikkatieto")
    @Autowired
    lateinit var paikkatietoJdbi: Jdbi

    @Autowired lateinit var documentClient: S3DocumentService

    @Autowired lateinit var bucketEnv: BucketEnv

    private val logger = KotlinLogging.logger {}

    @PostMapping("/reports")
    fun createReportFromScratch(
        user: AuthenticatedUser,
        @RequestBody body: ReportInput
    ): Report {
        return jdbi
            .inTransactionUnchecked { tx -> tx.insertReport(data = body, user = user) }
            .also { logger.audit(user, "CREATE_REPORT") }
    }

    @PostMapping("/reports/{reportId}/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadReportFile(
        user: AuthenticatedUser,
        @PathVariable reportId: UUID,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("description") description: String,
        @RequestParam("documentType") documentType: DocumentType
    ) {
        val dataBucket = bucketEnv.data

        val fileName = getAndCheckFileName(file)
        val contentType = file.inputStream.use { stream -> checkFileContentType(stream) }

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
        } catch (e: Exception) {
            logger.error("Error uploading file: ", e)
            jdbi.inTransactionUnchecked { tx ->
                tx.deleteReportFile(reportId, id)
            }
        }
    }

    @GetMapping("/reports/{id}")
    fun getReportById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): Report {
        return jdbi.inTransactionUnchecked { tx -> tx.getReport(id, user) }
    }

    @PostMapping("/reports/{reportId}/approve")
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

        val readers = reportFiles.mapNotNull({ rf -> getPaikkaTietoReader(dataBucket, "$reportId/${rf.id}", rf) })

        paikkatietoJdbi.inTransactionUnchecked { tx ->
            readers.forEach {
                it.use { reader ->
                    when (reader.tableDefinition) {
                        LiitoOravaPisteet -> tx.insertLiitoOravaPisteet(reader.asSequence())
                        LiitoOravaAlueet -> tx.insertLiitoOravaAlueet(reader.asSequence())
                        LiitoOravaYhteysviivat -> tx.insertLiitoOravaYhteysviivat(reader.asSequence())
                    }
                }
            }
        }

        jdbi.inTransactionUnchecked { tx ->
            tx.approveReport(
                reportId,
                user
            )
        }
    }

    @GetMapping("/reports/{reportId}/files")
    fun getReportFiles(
        @PathVariable reportId: UUID
    ): List<ReportFile> {
        return jdbi.inTransactionUnchecked { tx -> tx.getReportFiles(reportId) }
    }

    @DeleteMapping("/reports/{reportId}/files/{fileId}")
    fun deleteReportFile(
        @PathVariable reportId: UUID,
        @PathVariable fileId: UUID
    ) {
        val dataBucket = bucketEnv.data

        documentClient.delete(
            dataBucket,
            "$reportId/$fileId"
        )

        jdbi.inTransactionUnchecked { tx ->
            tx.deleteReportFile(reportId, fileId)
        }
    }

    private fun getPaikkaTietoReader(
        bucketName: String,
        fileName: String,
        reportFile: ReportFile
    ): GpkgReader? {
        val tableDefinition = getTableDefitinionByDocumentType(reportFile.documentType) ?: return null

        val document = documentClient.get(bucketName, fileName)

        val file = File.createTempFile(reportFile.fileName, "gpkg")
        file.writeBytes(document.bytes)

        val reader = GpkgReader(file, tableDefinition)

        return reader
    }
}

private fun getTableDefitinionByDocumentType(documentType: DocumentType) =
    when (documentType) {
        DocumentType.LIITO_ORAVA_PISTEET -> LiitoOravaPisteet
        DocumentType.LIITO_ORAVA_ALUEET -> LiitoOravaAlueet
        DocumentType.LIITO_ORAVA_VIIVAT -> LiitoOravaYhteysviivat
        else -> null
    }

private fun getAndCheckFileName(file: MultipartFile) =
    (file.originalFilename?.takeIf { it.isNotBlank() } ?: throw BadRequest("Filename missing"))

private fun getFileExtension(name: String) =
    name
        .split(".")
        .also { if (it.size == 1) throw BadRequest("Missing file extension", "EXTENSION_MISSING") }
        .last()
