// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import org.springframework.beans.factory.annotation.Autowired
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
        val createdOrderId =
            controller.createOrderFromScratch(
                user = testUser,
                body = OrderInput("Test order", "Test description", "12345", orderReportDocuments),
            )

        val orderResponse = controller.getOrderById(testUser, createdOrderId)

        assertNotNull(orderResponse)
        assertEquals("Test order", orderResponse.name)
        assertEquals("Test description", orderResponse.description)
        assertEquals(testUser.id, orderResponse.createdBy)
        assertEquals(testUser.id, orderResponse.updatedBy)
        assertEquals(
            orderResponse.reportDocuments,
            listOf(
                OrderReportDocument("Test description", DocumentType.LIITO_ORAVA_PISTEET),
                OrderReportDocument("Test description 2", DocumentType.LIITO_ORAVA_ALUEET)
            )
        )
    }
}
