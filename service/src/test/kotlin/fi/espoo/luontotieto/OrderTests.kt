// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import org.springframework.beans.factory.annotation.Autowired
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class OrderTests : FullApplicationTest() {
    @Autowired lateinit var controller: AppController

    @Test
    fun `create order with all data and fetch`() {
        val orderReportDocuments =
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
                OrderReportDocument("Test description 2", DocumentType.LIITO_ORAVA_ALUEET)
            )
        val createdOrder =
            controller.createOrderFromScratch(
                user = testUser,
                body = OrderInput("Test order", "Test description", listOf("12345"), orderReportDocuments),
            )

        val orderResponse = controller.getOrderById(testUser, createdOrder.orderId)

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
    }

    @Test
    fun `create order report and populate it with order fields`() {
        val orderReportDocuments =
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
            )
        val createdOrder =
            controller.createOrderFromScratch(
                user = testUser,
                body = OrderInput("Test order", "Test description", listOf("12345"), orderReportDocuments),
            )
        
        val orderReportResponse = controller.getReportById(testUser, createdOrder.reportId)

        assertNotNull(orderReportResponse)
        assertEquals("Test order", orderReportResponse.name)
        assertEquals("Test description", orderReportResponse.description)
        assertEquals("Teija Testaaja", orderReportResponse.createdBy)
        assertEquals("Teija Testaaja", orderReportResponse.updatedBy)
        assertEquals("Test order", orderReportResponse.order?.name)
        assertEquals("Test description", orderReportResponse.order?.description)
    }

    @Test
    fun `get all orders for user`() {
        for (i in 0..2) {
            controller.createOrderFromScratch(
                user = testUser,
                body = OrderInput("Test order $i", "Test description $i", listOf("12345"), listOf()),
            )
        }

        val expected = setOf("Test order 1", "Test order 2", "Test order 0")
        val ordersResponse = controller.getOrders(testUser).map { it.name }.toSet()

        assertEquals(expected, ordersResponse)
    }

    @Test
    fun `get all reports for user - no reports`() {
        controller.createOrderFromScratch(
            user = testUser,
            body = OrderInput("Test order", "Test description", listOf("12345"), listOf()),
        )

        val ordersResponse = controller.getReports(AuthenticatedUser(UUID.randomUUID()))
        assertEquals(0, ordersResponse.size)
    }

    @Test
    fun `update existing order`() {
        val createdOrder =
            controller.createOrderFromScratch(
                user = testUser,
                body =
                    OrderInput(
                        "Test order",
                        "Test description",
                        listOf("12345"),
                        listOf(
                            OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET)
                        )
                    ),
            )
        val updatedReportDocuments = listOf(OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_ALUEET))
        val updatedOrder =
            controller.updateOrder(
                testUser,
                createdOrder.orderId,
                OrderInput(
                    "New name",
                    "New description",
                    listOf("12345"),
                    updatedReportDocuments
                )
            )

        assertEquals("New name", updatedOrder.name)
        assertEquals("New description", updatedOrder.description)
        assertEquals(updatedReportDocuments, updatedOrder.reportDocuments)
    }
}
