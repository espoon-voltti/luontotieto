// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo

data class Report(
        val id: UUID,
        val name: String,
        val description: String,
        val approved: Boolean,
        val created: OffsetDateTime,
        val updated: OffsetDateTime,
        val createdBy: String,
        val updatedBy: String,
)

data class ReportInput(val name: String, val description: String, val orderId: UUID? = null)

fun Handle.insertReport(data: ReportInput, user: AuthenticatedUser): Report {
    return createQuery(
                    """
            WITH inserted_report AS (
                INSERT INTO report (name, description, created_by, updated_by, order_id) 
                VALUES (:name, :description, :createdBy, :updatedBy, :orderId)
                RETURNING *
            ) 
            SELECT r.id, r.name, r.description, r.created, r.updated, r.approved,
             CONCAT(uc.first_name, ' ', uc.last_name) AS "createdBy",
             CONCAT(uu.first_name, ' ', uu.last_name) AS "updatedBy", r.order_id as "orderId"
            FROM inserted_report r 
            LEFT JOIN users uc ON r.created_by = uc.id 
            LEFT JOIN users uu ON r.updated_by = uu.id
            """
            )
            .bind("name", data.name)
            .bind("description", data.description)
            .bind("orderId", data.orderId)
            .bind("createdBy", user.id)
            .bind("updatedBy", user.id)
            .mapTo<Report>()
            .one()
}

fun Handle.approveReport(reportId: UUID, user: AuthenticatedUser): Report {
    return createUpdate(
                    """
            UPDATE report 
              SET
                approved = TRUE,
                updated_by = :updatedBy
            WHERE id = :reportId
            """
            )
            .bind("reportId", reportId)
            .bind("updatedBy", user.id)
            .executeAndReturnGeneratedKeys()
            .mapTo<Report>()
            .one()
}

fun Handle.getReport(id: UUID, user: AuthenticatedUser) =
        createQuery(
                        """
                SELECT r.id, r.name, r.description, r.created, r.updated, r.approved, r.order_id as "orderId", CONCAT(uc.first_name, ' ', uc.last_name) AS "createdBy", CONCAT(uu.first_name, ' ', uu.last_name) AS "updatedBy"
                FROM report r 
                LEFT JOIN users uc ON r.created_by = uc.id 
                LEFT JOIN users uu ON r.updated_by = uu.id
                WHERE r.id = :id AND (r.created_by = :userId OR r.updated_by = :userId)
            """
                )
                .bind("id", id)
                .bind("userId", user.id)
                .mapTo<Report>()
                .findOne()
                .getOrNull()
                ?: throw NotFound()

fun Handle.getReports(user: AuthenticatedUser) =
        createQuery(
                        """
                SELECT r.id, r.name, r.description, r.created, r.updated, r.approved, r.order_id as "orderId", CONCAT(uc.first_name, ' ', uc.last_name) AS "createdBy", CONCAT(uu.first_name, ' ', uu.last_name) AS "updatedBy"
                FROM report r 
                LEFT JOIN users uc ON r.created_by = uc.id 
                LEFT JOIN users uu ON r.updated_by = uu.id
                WHERE created_by = :userId OR updated_by = :userId
                ORDER BY created DESC
            """
                )
                .bind("userId", user.id)
                .mapTo<Report>()
                .list()
                ?: emptyList()
