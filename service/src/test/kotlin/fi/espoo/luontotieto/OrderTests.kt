// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.ReportController
import fi.espoo.luontotieto.domain.UserRole
import org.springframework.beans.factory.annotation.Autowired
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class OrderTests : FullApplicationTest() {
    @Autowired lateinit var controller: OrderController

    @Autowired lateinit var reportController: ReportController

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
        assertEquals(customerUser.id, orderResponse.assigneeId)
    }

    @Test
    fun `create order report and populate it with order fields`() {
        val createdOrder = createOrderAndReport(controller = controller)

        val orderReportResponse = reportController.getReportById(adminUser, createdOrder.reportId)

        assertNotNull(orderReportResponse)
        assertEquals("Test order", orderReportResponse.name)
        assertEquals("Test description", orderReportResponse.description)
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
        val updatedOrder =
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
                    contactEmail = "contact@example.com",
                    contactPerson = "Contact Person",
                    contactPhone = "040123456789",
                    returnDate = LocalDate.of(2026, 1, 1)
                )
            )

        assertEquals("New name", updatedOrder.name)
        assertEquals("New description", updatedOrder.description)
        assertEquals("Yritys Oy", updatedOrder.assignee)
        assertEquals(customerUser.id, updatedOrder.assigneeId)
        assertEquals(updatedReportDocuments, updatedOrder.reportDocuments)
    }
}
