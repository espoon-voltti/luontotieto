// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.json.Json
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class OrderReportDocument(
    val description: String,
    val documentType: DocumentType
)

data class Order(
    val id: UUID,
    val name: String,
    val description: String,
    val planNumber: String?,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: UUID,
    val updatedBy: UUID,
    @Json val reportDocuments: List<OrderReportDocument>
)

data class OrderInput(
    val name: String,
    val description: String,
    val planNumber: String? = null,
    @Json val reportDocuments: List<OrderReportDocument>
)

fun Handle.insertOrder(
    data: OrderInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO "order" (name, description, plan_number, created_by, updated_by, report_documents) 
            VALUES (:name, :description, :planNumber, :createdBy, :updatedBy, :reportDocuments)
            RETURNING id
            """
    )
        .bindKotlin(data)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<UUID>()
        .one()
}

fun Handle.getOrder(
    id: UUID,
    user: AuthenticatedUser
): Order =
    createQuery(
        """
            SELECT id, name, description, created, updated,
             plan_number as "planNumber", report_documents as "reportDocuments",
             created_by AS "createdBy", updated_by AS "updatedBy"
            FROM "order"
            WHERE id = :id AND (created_by = :userId OR updated_by = :userId)
            """
    )
        .bind("id", id)
        .bind("userId", user.id)
        .mapTo<Order>()
        .findOne()
        .getOrNull() ?: throw NotFound()

fun Handle.getOrders(user: AuthenticatedUser) =
    createQuery(
        """
              SELECT id, name, description, created, updated,
                plan_number as "planNumber", report_documents as "reportDocuments",
                created_by AS "createdBy", updated_by AS "updatedBy"
              FROM "order"
              WHERE created_by = :userId OR updated_by = :userId
              ORDER BY created DESC
            """
    )
        .bind("userId", user.id)
        .mapTo<Order>()
        .list() ?: emptyList()
