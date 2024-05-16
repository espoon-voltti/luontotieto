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
            controller.createOrderFromScratch(
                user = adminUser,
                body =
                    OrderInput(
                        name = "Test order",
                        description = "Test description",
                        planNumber = listOf("12345"),
                        assigneeId = customerUser.id,
                        reportDocuments = orderReportDocuments
                    ),
            )

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
        assertEquals(customerUser.id, orderResponse.assigneeId)
    }

    @Test
    fun `create order report and populate it with order fields`() {
        val orderReportDocuments =
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
            )
        val createdOrder =
            controller.createOrderFromScratch(
                user = adminUser,
                body =
                    OrderInput(
                        name = "Test order",
                        description = "Test description",
                        planNumber = listOf("12345"),
                        assigneeId = customerUser.id,
                        reportDocuments = orderReportDocuments
                    ),
            )

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
        controller.createOrderFromScratch(
            user = adminUser,
            body =
                OrderInput(
                    name = "Test order",
                    description = "Test description",
                    planNumber = listOf("12345"),
                    assigneeId = customerUser.id,
                    reportDocuments = listOf()
                ),
        )

        val ordersResponse =
            reportController.getReports(AuthenticatedUser(UUID.randomUUID(), UserRole.CUSTOMER))
        assertEquals(0, ordersResponse.size)
    }

    @Test
    fun `update existing order`() {
        val createdOrder =
            controller.createOrderFromScratch(
                user = adminUser,
                body =
                    OrderInput(
                        name = "Test order",
                        description = "Test description",
                        planNumber = listOf("12345"),
                        assigneeId = customerUser.id,
                        reportDocuments =
                            listOf(
                                OrderReportDocument(
                                    "Test description",
                                    DocumentType.LIITO_ORAVA_PISTEET
                                )
                            )
                    ),
            )
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
                    reportDocuments = updatedReportDocuments
                )
            )

        assertEquals("New name", updatedOrder.name)
        assertEquals("New description", updatedOrder.description)
        assertEquals("Yritys Oy", updatedOrder.assignee)
        assertEquals(customerUser.id, updatedOrder.assigneeId)
        assertEquals(updatedReportDocuments, updatedOrder.reportDocuments)
    }
}
