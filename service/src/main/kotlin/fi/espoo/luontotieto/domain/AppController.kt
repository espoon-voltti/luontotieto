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
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
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

    @PostMapping("/reports/{reportId}/file", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
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

        documentClient.upload(
            dataBucket,
            Document(name = "$reportId/$id", bytes = file.bytes, contentType = contentType)
        )
    }

    @GetMapping("/reports/{id}")
    fun getReportById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): Report {
        return jdbi.inTransactionUnchecked { tx -> tx.getReport(id, user) }
    }
}

private fun getAndCheckFileName(file: MultipartFile) =
    (file.originalFilename?.takeIf { it.isNotBlank() } ?: throw BadRequest("Filename missing"))

private fun getFileExtension(name: String) =
    name
        .split(".")
        .also { if (it.size == 1) throw BadRequest("Missing file extension", "EXTENSION_MISSING") }
        .last()
