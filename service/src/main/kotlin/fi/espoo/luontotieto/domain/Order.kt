// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class Order(
    val id: UUID,
    val name: String,
    val description: String,
    val planNumber: String?,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: UUID,
    val updatedBy: UUID,
    val reportDocuments: List<OrderReportDocument>? = listOf()
)

data class OrderInput(
    val name: String,
    val description: String,
    val planNumber: String? = null,
    val reportDocuments: List<OrderReportDocumentInput>
)

fun Handle.insertOrder(
    data: OrderInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO "order" (name, description, plan_number, created_by, updated_by) 
            VALUES (:name, :description, :planNumber, :createdBy, :updatedBy)
            RETURNING id
            """
    )
        .bind("name", data.name)
        .bind("description", data.description)
        .bind("planNumber", data.planNumber)
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
             plan_number as "planNumber", created_by AS "createdBy", updated_by AS "updatedBy"
            FROM "order"
            WHERE id = :id AND (created_by = :userId OR updated_by = :userId)
            """
    )
        .bind("id", id)
        .bind("userId", user.id)
        .mapTo<Order>()
        .findOne()
        .getOrNull() ?: throw NotFound()
