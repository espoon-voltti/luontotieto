// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderDocumentType
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class OrderFileTests : FullApplicationTest() {
    @Autowired lateinit var controller: OrderController

    @Test
    fun `create order files and fetch and delete`() {
        val createdOrder =
            controller.createOrderFromScratch(
                user = testUser,
                body =
                    OrderInput(
                        name = "Test order",
                        description = "Test description",
                        planNumber = listOf("12345"),
                        assigneeId = companyUser.id,
                        reportDocuments =
                            listOf(
                                OrderReportDocument("Description", DocumentType.LIITO_ORAVA_PISTEET)
                            )
                    )
            )

        controller.uploadOrderFile(
            user = testUser,
            orderId = createdOrder.orderId,
            file =
                MockMultipartFile(
                    "tilaus_ohje.txt",
                    "tilaus_ohje.txt",
                    "text/plain",
                    "ORDER INFO CONTENT".toByteArray()
                ),
            documentType = OrderDocumentType.ORDER_INFO,
            description = "Test Description"
        )

        val orderFileResponse = controller.getOrderFiles(createdOrder.orderId)

        assertNotNull(orderFileResponse)
        assertEquals(orderFileResponse.count(), 1)
        val fileResponse = orderFileResponse.first()
        assertEquals("Test Description", fileResponse.description)
        assertEquals("tilaus_ohje.txt", fileResponse.fileName)
        assertEquals(OrderDocumentType.ORDER_INFO, fileResponse.documentType)
        assertEquals("text/plain", fileResponse.mediaType)
        assertEquals(testUser.id, fileResponse.createdBy)
        assertEquals(testUser.id, fileResponse.updatedBy)

        val s3Doc =
            controller.documentClient.get(
                controller.bucketEnv.data,
                "${createdOrder.orderId}/${orderFileResponse.first { it.fileName == "tilaus_ohje.txt" }.id}"
            )

        assertEquals("ORDER INFO CONTENT", String(s3Doc.bytes))

        controller.deleteOrderFile(
            user = testUser,
            orderId = createdOrder.orderId,
            fileId = fileResponse.id
        )

        val orderFilesAfterDelete = controller.getOrderFiles(createdOrder.orderId)
        assertEquals(0, orderFilesAfterDelete.count())
    }
}
