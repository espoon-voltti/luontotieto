// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.DatabaseEnum
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.enums.DatabaseValue
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

enum class OrderDocumentType : DatabaseEnum {
    @DatabaseValue("order:info")
    ORDER_INFO,

    @DatabaseValue("order:area")
    ORDER_AREA;

    override val sqlType = "order_document_type"
}

data class OrderFile(
    val id: UUID,
    val description: String?,
    val mediaType: String,
    val fileName: String,
    val documentType: OrderDocumentType,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: UUID,
    val updatedBy: UUID,
    val orderId: UUID
)

data class OrderFileInput(
    val orderId: UUID,
    val description: String?,
    val mediaType: String,
    val fileName: String,
    val documentType: OrderDocumentType
)

fun Handle.insertOrderFile(
    data: OrderFileInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO order_file (order_id, description, media_type, file_name, document_type, created_by, updated_by) 
            VALUES (:orderId, :description, :mediaType, :fileName, :documentType, :createdBy, :updatedBy)
            RETURNING id
            """
    )
        .bind("orderId", data.orderId)
        .bind("description", data.description)
        .bind("mediaType", data.mediaType)
        .bind("fileName", data.fileName)
        .bind("documentType", data.documentType)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<UUID>()
        .one()
}

fun Handle.getOrderFiles(
    orderId: UUID,
    user: AuthenticatedUser
): List<OrderFile> {
    return createQuery(
        """
                SELECT of.id, of.description, of.order_id AS "orderId", of.media_type AS "mediaType", 
                of.file_name AS "fileName", of.document_type AS "documentType",
                of.created, of.updated, of.created_by AS "createdBy", of.updated_by AS "updatedBy"
                FROM order_file of
                JOIN "order" o ON o.id = of.order_id
                JOIN users u ON (u.id = :userId AND ((u.id = o.assignee_id) OR u.role != 'yrityskäyttäjä'))
                WHERE of.order_id = :orderId
            """
    )
        .bind("orderId", orderId)
        .bind("userId", user.id)
        .mapTo<OrderFile>()
        .list()
}

fun Handle.getOrderFileById(
    orderId: UUID,
    fileId: UUID,
    user: AuthenticatedUser
): OrderFile {
    return createQuery(
        """
                SELECT of.id, of.description, of.order_id AS "orderId", of.media_type AS "mediaType", 
                of.file_name AS "fileName", of.document_type AS "documentType",
                of.created, of.updated, of.created_by AS "createdBy", of.updated_by AS "updatedBy"
                FROM order_file of 
                JOIN "order" o ON o.id = of.order_id
                JOIN users u ON (u.id = :userId AND ((u.id = o.assignee_id) OR u.role != 'yrityskäyttäjä'))
                WHERE of.order_id = :orderId AND of.id = :fileId  
            """
    )
        .bind("orderId", orderId)
        .bind("fileId", fileId)
        .bind("userId", user.id)
        .mapTo<OrderFile>()
        .findOne()
        .getOrNull() ?: throw NotFound()
}

fun Handle.deleteOrderFile(
    orderId: UUID,
    fileId: UUID
) {
    createUpdate("DELETE FROM order_file WHERE id = :fileId AND order_id = :orderId")
        .bind("fileId", fileId)
        .bind("orderId", orderId)
        .execute()
}
