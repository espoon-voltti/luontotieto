// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.PropagateNull
import org.jdbi.v3.json.Json
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class OrderReportDocument(val description: String, val documentType: DocumentType)

data class Order(
    @PropagateNull val id: UUID,
    val name: String,
    val description: String,
    val planNumber: List<String>?,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: String,
    val updatedBy: String,
    @Json val reportDocuments: List<OrderReportDocument>
)

data class OrderInput(
    val name: String,
    val description: String,
    val planNumber: List<String>? = null,
    @Json val reportDocuments: List<OrderReportDocument>
)

private const val SELECT_ORDER_SQL =
    """
    SELECT o.id,
           o.name,
           o.description,
           o.plan_number as "planNumber",
           o.report_documents as "reportDocuments",
           o.created,
           o.updated,
           CONCAT(uc.first_name, ' ', uc.last_name) AS "createdBy",
           CONCAT(uu.first_name, ' ', uu.last_name) AS "updatedBy"
    FROM "order" o
        LEFT JOIN users uc ON o.created_by = uc.id
        LEFT JOIN users uu ON o.updated_by = uu.id
"""

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

fun Handle.purOrder(
    id: UUID,
    order: OrderInput,
    user: AuthenticatedUser
): Order {
    return createQuery(
        """
            WITH "order" AS (
                UPDATE "order" 
                 SET name = :name, description = :description, updated_by = :updatedBy,
                  plan_number = :planNumber, report_documents = :reportDocuments
                 WHERE id = :id AND (created_by = :updatedBy OR updated_by = :updatedBy)
                RETURNING *
            ) 
            $SELECT_ORDER_SQL
            """
    ).bindKotlin(order)
        .bind("id", id)
        .bind("updatedBy", user.id)
        .mapTo<Order>()
        .findOne()
        .getOrNull() ?: throw NotFound()
}

fun Handle.getOrder(
    id: UUID,
    user: AuthenticatedUser
): Order =
    createQuery(
        """
            $SELECT_ORDER_SQL
            WHERE o.id = :id AND (o.created_by = :userId OR o.updated_by = :userId)
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
             $SELECT_ORDER_SQL
              WHERE o.created_by = :userId OR o.updated_by = :userId
              ORDER BY o.created DESC
            """
    )
        .bind("userId", user.id)
        .mapTo<Order>()
        .list() ?: emptyList()

fun Handle.getPlanNumbers(
): List<String> =
    createQuery(
        """
            SELECT DISTINCT (unnest(plan_number)) FROM "order"
            """
    )
        .mapTo<String>()
        .list() ?: emptyList()

