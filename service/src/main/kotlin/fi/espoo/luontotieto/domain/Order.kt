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
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class OrderReportDocument(val description: String, val documentType: DocumentType)

data class Order(
    @PropagateNull val id: UUID,
    val name: String,
    val description: String,
    val planNumber: List<String>?,
    val orderingUnit: List<String>?,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: String,
    val updatedBy: String,
    val assignee: String,
    val assigneeId: UUID,
    val assigneeContactPerson: String,
    val assigneeContactEmail: String,
    val returnDate: LocalDate,
    val contactPerson: String,
    val contactPhone: String,
    val contactEmail: String,
    @Json val reportDocuments: List<OrderReportDocument>
)

data class OrderInput(
    val name: String,
    val description: String,
    val planNumber: List<String>? = null,
    val orderingUnit: List<String>? = null,
    val assigneeId: UUID,
    val assigneeContactPerson: String,
    val assigneeContactEmail: String,
    @Json val reportDocuments: List<OrderReportDocument>,
    val returnDate: LocalDate,
    val contactPerson: String,
    val contactPhone: String,
    val contactEmail: String
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
           o.assignee_contact_person AS "assigneeContactPerson",
           o.assignee_contact_email AS "assigneeContactEmail",
           o.return_date AS "returnDate",
           o.contact_person AS "contactPerson",
           o.contact_phone AS "contactPhone",
           o.contact_email AS "contactEmail",
           o.ordering_unit as "orderingUnit",
           uc.name AS "createdBy",
           uu.name AS "updatedBy",
           ua.name AS "assignee",
           o.assignee_id AS "assigneeId"
    FROM "order" o
        LEFT JOIN users uc ON o.created_by = uc.id
        LEFT JOIN users uu ON o.updated_by = uu.id
        LEFT JOIN users ua ON o.assignee_id = ua.id
"""

fun Handle.insertOrder(
    data: OrderInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO "order" (name, description, plan_number, created_by, updated_by, report_documents, assignee_id, assignee_contact_person, assignee_contact_email, return_date, contact_person, contact_phone, contact_email, ordering_unit) 
            VALUES (:name, :description, :planNumber, :createdBy, :updatedBy, :reportDocuments, :assigneeId, :assigneeContactPerson, :assigneeContactEmail, :returnDate, :contactPerson, :contactPhone, :contactEmail, :orderingUnit)
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

fun Handle.putOrder(
    id: UUID,
    order: OrderInput,
    user: AuthenticatedUser
): Order {
    return createQuery(
        """
            WITH "order" AS (
                UPDATE "order" 
                 SET name = :name, description = :description, updated_by = :updatedBy,
                  plan_number = :planNumber, report_documents = :reportDocuments, assignee_id = :assigneeId,
                  assignee_contact_person = :assigneeContactPerson, assignee_contact_email = :assigneeContactEmail,
                  return_date = :returnDate, contact_person = :contactPerson, contact_phone = :contactPhone,
                  contact_email = :contactEmail, ordering_unit = :orderingUnit
                 WHERE id = :id
                RETURNING *
            ) 
            $SELECT_ORDER_SQL
            """
    )
        .bindKotlin(order)
        .bind("id", id)
        .bind("updatedBy", user.id)
        .mapTo<Order>()
        .findOne()
        .getOrNull()
        ?: throw NotFound()
}

fun Handle.getOrder(id: UUID): Order =
    createQuery(
        """
            $SELECT_ORDER_SQL
            WHERE o.id = :id
            """
    )
        .bind("id", id)
        .mapTo<Order>()
        .findOne()
        .getOrNull()
        ?: throw NotFound()

fun Handle.getPlanNumbers(): List<String> =
    createQuery(
        """
            SELECT DISTINCT (unnest(plan_number)) FROM "order"
            """
    )
        .mapTo<String>()
        .sorted()

fun Handle.getorderingUnits(): List<String> =
    createQuery(
        """
            SELECT DISTINCT (unnest(ordering_unit)) FROM "order"
            """
    )
        .mapTo<String>()
        .sorted()
