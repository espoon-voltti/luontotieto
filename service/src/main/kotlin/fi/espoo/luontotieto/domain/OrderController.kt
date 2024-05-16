// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.BucketEnv
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.s3.Document
import fi.espoo.luontotieto.s3.S3DocumentService
import fi.espoo.luontotieto.s3.checkFileContentType
import fi.espoo.luontotieto.s3.getAndCheckFileName
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
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
import java.net.URL
import java.util.UUID

@RestController
@RequestMapping("/orders")
class OrderController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    @Qualifier("jdbi-paikkatieto")
    @Autowired
    lateinit var paikkatietoJdbi: Jdbi

    @Autowired lateinit var documentClient: S3DocumentService

    @Autowired lateinit var bucketEnv: BucketEnv

    private val logger = KotlinLogging.logger {}

    @GetMapping("/plan-numbers")
    fun getPlanNumbers(user: AuthenticatedUser): List<String> {
        return jdbi.inTransactionUnchecked { tx -> tx.getPlanNumbers() }
    }

    @GetMapping()
    fun getOrders(user: AuthenticatedUser): List<Order> {
        return jdbi.inTransactionUnchecked { tx -> tx.getOrders(user) }
    }

    @GetMapping("/{id}")
    fun getOrderById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): Order {
        return jdbi.inTransactionUnchecked { tx -> tx.getOrder(id, user) }
    }

    data class CreateOrderResponse(
        val orderId: UUID,
        val reportId: UUID,
    )

    @PostMapping()
    @ResponseStatus(HttpStatus.CREATED)
    fun createOrderFromScratch(
        user: AuthenticatedUser,
        @RequestBody body: OrderInput
    ): CreateOrderResponse {
        return jdbi
            .inTransactionUnchecked { tx ->
                val orderId = tx.insertOrder(data = body, user = user)
                val report =
                    tx.insertReport(
                        Report.Companion.ReportInput(body.name, body.description),
                        user,
                        orderId
                    )
                CreateOrderResponse(orderId, report.id)
            }
            .also { logger.audit(user, AuditEvent.CREATE_ORDER, mapOf("id" to "$it")) }
    }

    @PutMapping("/{id}")
    fun updateOrder(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody order: OrderInput
    ): Order {
        return jdbi
            .inTransactionUnchecked { tx -> tx.putOrder(id, order, user) }
            .also { logger.audit(user, AuditEvent.UPDATE_ORDER, mapOf("id" to "$id")) }
    }

    @PostMapping("/{orderId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    fun createOrderReport(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID
    ): Report {
        return jdbi
            .inTransactionUnchecked { tx ->
                val order = tx.getOrder(orderId, user)
                val reportInput = Report.Companion.ReportInput(order.name, order.description)
                tx.insertReport(reportInput, user, order.id)
            }
            .also {
                logger.audit(user, AuditEvent.CREATE_REPORT_FOR_ORDER_ID, mapOf("id" to "$orderId"))
            }
    }

    @PostMapping("/{orderId}/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadOrderFile(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("description") description: String,
        @RequestParam("documentType") documentType: OrderDocumentType
    ) {
        val dataBucket = bucketEnv.data

        val fileName = getAndCheckFileName(file)
        val contentType = file.inputStream.use { stream -> checkFileContentType(stream) }

        val id =
            jdbi.inTransactionUnchecked { tx ->
                tx.insertOrderFile(
                    OrderFileInput(orderId, description, contentType, fileName, documentType),
                    user
                )
            }

        try {
            documentClient.upload(
                dataBucket,
                Document(name = "$orderId/$id", bytes = file.bytes, contentType = contentType)
            )
            logger.audit(
                user,
                AuditEvent.ADD_ORDER_FILE,
                mapOf("id" to "$orderId", "file" to "$id")
            )
        } catch (e: Exception) {
            logger.error("Error uploading file: ", e)
            jdbi.inTransactionUnchecked { tx -> tx.deleteOrderFile(orderId, id) }
            throw BadRequest("Error uploading file")
        }
    }

    @GetMapping("/{orderId}/files")
    fun getOrderFiles(
        @PathVariable orderId: UUID
    ): List<OrderFile> {
        return jdbi.inTransactionUnchecked { tx -> tx.getOrderFiles(orderId) }
    }

    @DeleteMapping("/{orderId}/files/{fileId}")
    fun deleteOrderFile(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
        @PathVariable fileId: UUID
    ) {
        val dataBucket = bucketEnv.data

        documentClient.delete(dataBucket, "$orderId/$fileId")

        jdbi
            .inTransactionUnchecked { tx -> tx.deleteOrderFile(orderId, fileId) }
            .also {
                logger.audit(
                    user,
                    AuditEvent.DELETE_ORDER_FILE,
                    mapOf("id" to "$orderId", "file" to "$fileId")
                )
            }
    }

    @GetMapping("/{orderId}/files/{fileId}")
    fun getOrderFileById(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
        @PathVariable fileId: UUID
    ): URL {
        val dataBucket = bucketEnv.data

        val orderFile = jdbi.inTransactionUnchecked { tx -> tx.getOrderFileById(orderId, fileId) }
        val contentDisposition =
            ContentDisposition.attachment().filename(orderFile.fileName).build()

        val fileUrl =
            documentClient.presignedGetUrl(dataBucket, "$orderId/$fileId", contentDisposition)
        return fileUrl
    }
}
