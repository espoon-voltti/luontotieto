// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderDocumentType
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.ReportController
import fi.espoo.luontotieto.domain.UserRole
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import java.io.File
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class OrderTests : FullApplicationTest() {
    @Autowired
    lateinit var controller: OrderController

    @Autowired
    lateinit var reportController: ReportController

    @Test
    fun `create order with all data and fetch`() {
        val orderReportDocuments =
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
                OrderReportDocument("Test description 2", DocumentType.LIITO_ORAVA_ALUEET)
            )
        val createdOrder =
            createOrderAndReport(controller = controller, reportDocuments = orderReportDocuments)

        val orderResponse = controller.getOrderById(adminUser, createdOrder.orderId)

        assertNotNull(orderResponse)
        assertEquals("Test order", orderResponse.name)
        assertEquals("Test description", orderResponse.description)
        assertEquals("Teija Testaaja", orderResponse.createdBy)
        assertEquals("Teija Testaaja", orderResponse.updatedBy)
        assertEquals(
            orderResponse.reportDocuments,
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
                OrderReportDocument("Test description 2", DocumentType.LIITO_ORAVA_ALUEET)
            )
        )
        assertEquals("Yritys Oy", orderResponse.assignee)
        assertEquals("Person Name", orderResponse.assigneeContactPerson)
        assertEquals("person.name@example.com", orderResponse.assigneeContactEmail)
        assertEquals(LocalDate.of(2030, 1, 1), orderResponse.returnDate)
        assertEquals("contact@example.com", orderResponse.contactEmail)
        assertEquals("Contact Person", orderResponse.contactPerson)
        assertEquals("04012345678", orderResponse.contactPhone)
        assertEquals(listOf("Plan 1", "Plan 2"), orderResponse.planNumber)
        assertEquals(listOf("Orava yksikkö", "Karhuryhmä"), orderResponse.orderingUnit)
        assertEquals(customerUser.id, orderResponse.assigneeId)
    }

    @Test
    fun `create order report and populate it with order fields`() {
        val createdOrder = createOrderAndReport(controller = controller)

        val orderReportResponse = reportController.getReportById(adminUser, createdOrder.reportId)

        assertNotNull(orderReportResponse)
        assertEquals("Test order", orderReportResponse.name)
        assertEquals("Teija Testaaja", orderReportResponse.createdBy)
        assertEquals("Teija Testaaja", orderReportResponse.updatedBy)
        assertEquals("Test order", orderReportResponse.order?.name)
        assertEquals("Test description", orderReportResponse.order?.description)
        assertEquals("Yritys Oy", orderReportResponse.order?.assignee)
        assertEquals(customerUser.id, orderReportResponse.order?.assigneeId)
    }

    @Test
    fun `get all reports - no reports`() {
        createOrderAndReport(controller = controller)

        val ordersResponse =
            reportController.getReports(AuthenticatedUser(UUID.randomUUID(), UserRole.CUSTOMER))
        assertEquals(0, ordersResponse.size)
    }

    @Test
    fun `update existing order`() {
        val createdOrder = createOrderAndReport(controller = controller)
        val updatedReportDocuments =
            listOf(OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_ALUEET))
        val updatedReport =
            controller.updateOrder(
                adminUser,
                createdOrder.orderId,
                OrderInput(
                    name = "New name",
                    description = "New description",
                    planNumber = listOf("12345"),
                    assigneeId = customerUser.id,
                    reportDocuments = updatedReportDocuments,
                    assigneeContactEmail = "email@example.com",
                    assigneeContactPerson = "Person Name",
                    assigneeCompanyName = "Ylikirjoitus Oy",
                    contactEmail = "contact@example.com",
                    contactPerson = "Contact Person",
                    contactPhone = "040123456789",
                    orderingUnit = listOf("Orava yksikkö"),
                    returnDate = LocalDate.of(2026, 1, 1)
                )
            )

        assertEquals("New name", updatedReport.order?.name)
        assertEquals("New description", updatedReport.order?.description)
        assertEquals("Yritys Oy", updatedReport.order?.assignee)
        assertEquals("Ylikirjoitus Oy", updatedReport.order?.assigneeCompanyName)
        assertEquals(customerUser.id, updatedReport.order?.assigneeId)
        assertEquals(updatedReportDocuments, updatedReport.order?.reportDocuments)
    }

    @Test
    fun `Delete order and report`() {
        val createdOrder = createOrderAndReport(controller = controller)

        controller.deleteOrder(adminUser, createdOrder.orderId)

        assertThrows<NotFound> { controller.getOrderById(adminUser, createdOrder.orderId) }
        assertThrows<NotFound> { reportController.getReportById(adminUser, createdOrder.reportId) }
        assertThrows<NotFound> { reportController.getReportFiles(adminUser, createdOrder.reportId) }
        val orderFiles = controller.getOrderFiles(adminUser, createdOrder.orderId)
        assertEquals(orderFiles.count(), 0)
    }

    @Test
    fun `Can not delete order that has filled report data`() {
        val createdOrder = createOrderAndReport(controller = controller)

        createLiitoOravaPisteetReportFile(reportController, createdOrder.reportId)

        assertThrows<BadRequest> { controller.deleteOrder(adminUser, createdOrder.orderId) }

        val report = reportController.getReportById(adminUser, createdOrder.reportId)

        assertNotNull(report)
    }

    @Test
    fun `Can not update or delete order that has approved report`() {
        val createdOrder = createOrderAndReport(controller = controller)

        controller.uploadOrderFile(
            user = adminUser,
            orderId = createdOrder.orderId,
            file =
                MockMultipartFile(
                    "tilaus_ohje.txt",
                    "tilaus_ohje.txt",
                    "text/plain",
                    "ORDER INFO CONTENT".toByteArray()
                ),
            documentType = OrderDocumentType.ORDER_INFO,
            description = "Test Description",
            id = UUID.randomUUID().toString()
        )
        File("src/test/resources/test-data/aluerajaus_luontoselvitys.gpkg").inputStream().use { inStream ->
            assertEquals(
                controller
                    .uploadOrderFile(
                        user = adminUser,
                        orderId = createdOrder.orderId,
                        file =
                            MockMultipartFile(
                                "aluerajaus_luontoselvitys_tilaus.gpkg",
                                "aluerajaus_luontoselvitys_tilaus.gpkg",
                                "application/geopackage+sqlite3",
                                inStream
                            ),
                        description =
                            "Alustava aluerajaus tilaukselle.",
                        documentType = OrderDocumentType.ORDER_AREA,
                        id = UUID.randomUUID().toString()
                    ).statusCode
                    .value(),
                201
            )
        }

        createLiitoOravaPisteetReportFile(reportController, createdOrder.reportId)

        reportController.approveReport(adminUser, createdOrder.reportId)

        assertThrows<BadRequest> {
            controller.updateOrder(
                adminUser,
                createdOrder.orderId,
                OrderInput(
                    name = "New name",
                    description = "New description",
                    planNumber = listOf("12345"),
                    assigneeId = customerUser.id,
                    reportDocuments =
                        listOf(
                            OrderReportDocument(
                                "Test description",
                                DocumentType.LIITO_ORAVA_ALUEET
                            )
                        ),
                    assigneeContactEmail = "email@example.com",
                    assigneeContactPerson = "Person Name",
                    assigneeCompanyName = "Ylikirjoitus Oy",
                    contactEmail = "contact@example.com",
                    contactPerson = "Contact Person",
                    contactPhone = "040123456789",
                    orderingUnit = listOf("Orava yksikkö"),
                    returnDate = LocalDate.of(2026, 1, 1)
                )
            )
        }
        assertThrows<BadRequest> { controller.deleteOrder(adminUser, createdOrder.orderId) }

        assertThrows<BadRequest> {
            controller.uploadOrderFile(
                user = adminUser,
                orderId = createdOrder.orderId,
                file =
                    MockMultipartFile(
                        "tilaus_ohje.txt",
                        "tilaus_ohje.txt",
                        "text/plain",
                        "ORDER INFO CONTENT".toByteArray()
                    ),
                documentType = OrderDocumentType.ORDER_INFO,
                description = "Test Description",
                id = UUID.randomUUID().toString()
            )
        }
        val orderFileResponse = controller.getOrderFiles(adminUser, createdOrder.orderId)

        assertNotNull(orderFileResponse)
        assertEquals(orderFileResponse.count(), 2)
        val fileResponse = orderFileResponse.first()

        assertThrows<BadRequest> {
            controller.deleteOrderFile(
                user = adminUser,
                orderId = createdOrder.orderId,
                fileId = fileResponse.id
            )
        }
    }
}
