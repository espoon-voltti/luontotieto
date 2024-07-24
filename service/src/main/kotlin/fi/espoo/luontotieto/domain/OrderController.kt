// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.common.Emails
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
import fi.espoo.paikkatieto.domain.deleteAluerajausLuontoselvitystilaus
import fi.espoo.paikkatieto.domain.insertPaikkatieto
import fi.espoo.paikkatieto.reader.GpkgReader
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.reader.GpkgValidationErrorReason
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.ContentDisposition
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
import java.io.IOException
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

    @Autowired
    lateinit var sesEmailClient: SESEmailClient

    @Autowired
    lateinit var documentClient: S3DocumentService

    @Autowired
    lateinit var bucketEnv: BucketEnv

    @Autowired
    lateinit var emailEnv: EmailEnv

    @Autowired
    lateinit var luontotietoHost: LuontotietoHost

    private val logger = KotlinLogging.logger {}

    @GetMapping("/plan-numbers")
    fun getPlanNumbers(user: AuthenticatedUser): List<String> {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        return jdbi.inTransactionUnchecked { tx -> tx.getPlanNumbers() }
    }

    @GetMapping("/ordering-units")
    fun getorderingUnits(user: AuthenticatedUser): List<String> {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        return jdbi.inTransactionUnchecked { tx -> tx.getorderingUnits() }
    }

    @GetMapping("/{id}")
    fun getOrderById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): Order {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        return jdbi.inTransactionUnchecked { tx -> tx.getOrder(id) }
    }

    data class CreateOrderResponse(
        val orderId: UUID,
        val reportId: UUID,
    )

    data class OrderIdAndReport(
        val orderId: UUID,
        val report: Report,
    )

    @PostMapping()
    @ResponseStatus(HttpStatus.CREATED)
    fun createOrderFromScratch(
        user: AuthenticatedUser,
        @RequestBody body: OrderInput
    ): CreateOrderResponse {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        val response =
            jdbi
                .inTransactionUnchecked { tx ->
                    val orderId = tx.insertOrder(data = body, user = user)
                    val report =
                        tx.insertReport(
                            Report.Companion.ReportInput(body.name, null, null),
                            user,
                            orderId
                        )
                    OrderIdAndReport(orderId, report)
                }
                .also {
                    logger.audit(user, AuditEvent.CREATE_ORDER, mapOf("id" to "${it.orderId}"))
                }

        if (emailEnv.enabled) {
            sendReportCreatedEmail(response.report, body.assigneeId, body.assigneeContactEmail)
        }
        return CreateOrderResponse(response.orderId, response.report.id)
    }

    @PutMapping("/{id}")
    fun updateOrder(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody order: OrderInput
    ): Report {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        return jdbi
            .inTransactionUnchecked { tx ->
                tx.putOrder(id, order, user)
                tx.getReportByOrderId(id, user)
            }
            .also { logger.audit(user, AuditEvent.UPDATE_ORDER, mapOf("id" to "$id")) }
    }

    @DeleteMapping("/{orderId}")
    fun deleteOrder(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
    ) {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        val dataBucket = bucketEnv.data
        jdbi
            .inTransactionUnchecked { tx ->
                val report = tx.getReportByOrderId(orderId, user)
                val reportFiles = tx.getReportFiles(report.id)
                if (reportFiles.isNotEmpty()) {
                    throw BadRequest(
                        "Tilausta ei voi poistaa koska selvitykseen on jo tallennettu tiedostoja",
                        "order-delete-failed-existing-files"
                    )
                }
                val orderFiles = tx.getOrderFiles(orderId, user)
                for (of in orderFiles) {
                    documentClient.delete(dataBucket, "$orderId/${of.id}")
                }
                tx.deleteOrderAndReportData(orderId, report.id)
            }
            .also { logger.audit(user, AuditEvent.DELETE_ORDER, mapOf("id" to "$orderId")) }
    }

    @PostMapping("/{orderId}/files", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadOrderFile(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("description") description: String?,
        @RequestParam("documentType") documentType: OrderDocumentType
    ): ResponseEntity<List<GpkgValidationError>> {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)

        val dataBucket = bucketEnv.data
        val fileName = getAndCheckFileName(file)
        val contentType = file.inputStream.use { stream -> checkFileContentType(stream) }

        var id: UUID? = null
        try {
            if (documentType == OrderDocumentType.ORDER_AREA) {
                val tableDefinition = TableDefinition.ALUERAJAUS_LUONTOSELVITYSTILAUS
                val tmpGpkgFile = kotlin.io.path.createTempFile(fileName)
                file.transferTo(tmpGpkgFile)
                val gpkgReader: GpkgReader?
                try {
                    gpkgReader = GpkgReader(File(tmpGpkgFile.toUri()), tableDefinition)
                } catch (e: IOException) {
                    logger.error("Error reading GeoPackage file: $fileName", e)
                    throw BadRequest("Error reading GeoPackage file: ${file.name}")
                }

                gpkgReader.use { reader ->
                    val data = reader.asSequence().toList()
                    if (data.isEmpty()) {
                        logger.error("No data in file: $fileName")
                        return ResponseEntity.badRequest()
                            .body(
                                listOf(
                                    GpkgValidationError(
                                        "-1",
                                        "geom",
                                        null,
                                        GpkgValidationErrorReason.IS_NULL
                                    )
                                )
                            )
                    }
                    val errors = data.flatMap { it.errors }.toList()
                    if (errors.isNotEmpty()) {
                        logger.error(errors.toString())
                        return ResponseEntity.badRequest().body(errors)
                    }

                    jdbi.inTransactionUnchecked { tx ->
                        val report = tx.getReportByOrderId(orderId, user)
                        val params =
                            tx.getAluerajausLuontoselvitysTilausParams(
                                report,
                                luontotietoHost.getReportUrl(report.id)
                            )

                        paikkatietoJdbi.inTransactionUnchecked { ptx ->
                            ptx.insertPaikkatieto(
                                reader.tableDefinition,
                                report,
                                data.asSequence(),
                                params
                            )
                        }
                    }
                }
            }

            id =
                jdbi.inTransactionUnchecked { tx ->
                    tx.insertOrderFile(
                        OrderFileInput(orderId, description, contentType, fileName, documentType),
                        user
                    )
                }

            documentClient.upload(
                dataBucket,
                MultipartDocument(name = "$orderId/$id", file = file, contentType = contentType)
            )

            logger.audit(
                user,
                AuditEvent.ADD_ORDER_FILE,
                mapOf("id" to "$orderId", "file" to "$id")
            )
        } catch (e: Exception) {
            logger.error("Error uploading file: ", e)
            if (id != null) {
                jdbi.inTransactionUnchecked { tx -> tx.deleteOrderFile(orderId, id) }
            }
            throw BadRequest("Error uploading file")
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(emptyList())
    }

    @GetMapping("/{orderId}/files")
    fun getOrderFiles(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID
    ) = jdbi.inTransactionUnchecked { tx -> tx.getOrderFiles(orderId, user) }

    @DeleteMapping("/{orderId}/files/{fileId}")
    fun deleteOrderFile(
        user: AuthenticatedUser,
        @PathVariable orderId: UUID,
        @PathVariable fileId: UUID
    ) {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        val dataBucket = bucketEnv.data
        documentClient.delete(dataBucket, "$orderId/$fileId")
        jdbi
            .inTransactionUnchecked { tx ->
                val report = tx.getReportByOrderId(orderId, user)
                tx.deleteOrderFile(orderId, fileId)
                paikkatietoJdbi.inTransactionUnchecked { ptx ->
                    ptx.deleteAluerajausLuontoselvitystilaus(report.id)
                }
            }
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

        val orderFile =
            jdbi.inTransactionUnchecked { tx -> tx.getOrderFileById(orderId, fileId, user) }
        val contentDisposition =
            ContentDisposition.attachment().filename(orderFile.fileName).build()

        val fileUrl =
            documentClient.presignedGetUrl(dataBucket, "$orderId/$fileId", contentDisposition)
        return fileUrl
    }

    private fun sendReportCreatedEmail(
        report: Report,
        assigneeId: UUID,
        contactEmail: String?
    ) {
        try {
            jdbi.inTransactionUnchecked { tx ->
                val user = tx.getUser(assigneeId)
                val emails = listOf(user.email, contactEmail).filterNotNull().distinct()
                emails.forEach { email ->
                    sesEmailClient.send(
                        Email(
                            email,
                            Emails.getReportCreatedEmail(
                                report.name,
                                report.order?.description ?: "",
                                luontotietoHost.getReportUrl(report.id)
                            )
                        )
                    )
                }
            }
        } catch (e: Exception) {
            logger.error("Error sending email: ", e)
        }
    }
}
