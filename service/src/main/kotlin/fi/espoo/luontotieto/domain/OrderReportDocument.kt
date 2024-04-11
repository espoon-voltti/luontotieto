// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import java.util.UUID

data class OrderReportDocument(
    val orderId: UUID,
    val description: String,
    val documentType: DocumentType
)

data class OrderReportDocumentInput(
    val description: String,
    val documentType: DocumentType
)

fun Handle.insertOrderReportDocuments(
    orderId: UUID,
    data: List<OrderReportDocumentInput>,
) {
    val batchInsert =
        prepareBatch(
            """
    INSERT INTO order_report_document (order_id, description, document_type) 
    VALUES (:orderId, :description, :documentType)
    RETURNING order_id as "orderId", description, document_type as "documentType"
    """
        )
    data.forEach { orderReport ->
        batchInsert.bindKotlin(orderReport).bind("orderId", orderId).add()
    }
    batchInsert.execute()
}

fun Handle.getOrderReportDocuments(orderId: UUID): List<OrderReportDocument> =
    createQuery(
        """
            SELECT order_id, description, document_type as "documentType"
            FROM order_report_document
            WHERE order_id = :orderId
            """
    )
        .bind("orderId", orderId)
        .mapTo<OrderReportDocument>()
        .toList()
