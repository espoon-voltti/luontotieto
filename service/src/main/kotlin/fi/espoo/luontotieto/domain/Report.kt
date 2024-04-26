// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.paikkatieto.domain.TableDefinition
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.Nested
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class Report(
    val id: UUID,
    val name: String,
    val description: String,
    val approved: Boolean,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: String,
    val updatedBy: String,
    @Nested("o_") val order: Order?
) {
    companion object {
        data class ReportInput(
            val name: String,
            val description: String,
        )
    }
}

private const val SELECT_REPORT_SQL =
    """
    SELECT r.id                                       AS "id",
           r.name                                     AS "name",
           r.description                              AS "description",
           r.created                                  AS "created",
           r.updated                                  AS "updated",
           r.approved                                 AS "approved",
           CONCAT(uc.first_name, ' ', uc.last_name)   AS "createdBy",
           CONCAT(uu.first_name, ' ', uu.last_name)   AS "updatedBy",
           r.order_id                                 AS "orderId",
           o.id                                       AS "o_id",
           o.name                                     AS "o_name",
           o.description                              AS "o_description",
           o.created                                  AS "o_created",
           o.updated                                  AS "o_updated",
           o.plan_number                              AS "o_planNumber",
           o.report_documents                         AS "o_reportDocuments",
           CONCAT(ouc.first_name, ' ', ouc.last_name) AS "o_createdBy",
           CONCAT(ouu.first_name, ' ', ouu.last_name) AS "o_updatedBy"
    FROM report r
             LEFT JOIN users uc ON r.created_by = uc.id
             LEFT JOIN users uu ON r.updated_by = uu.id
             LEFT JOIN "order" o ON r.order_id = o.id
             LEFT JOIN users ouc ON o.created_by = ouc.id
             LEFT JOIN users ouu ON o.updated_by = ouu.id
"""

fun Handle.insertReport(
    data: Report.Companion.ReportInput,
    user: AuthenticatedUser,
    orderI: UUID? = null
): Report {
    return createQuery(
        """
            WITH report AS (
                INSERT INTO report (name, description, created_by, updated_by, order_id) 
                VALUES (:name, :description, :createdBy, :updatedBy, :orderId)
                RETURNING *
            ) 
            $SELECT_REPORT_SQL
            """
    )
        .bind("name", data.name)
        .bind("description", data.description)
        .bind("orderId", orderI)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .mapTo<Report>()
        .one()
}

fun Handle.approveReport(
    reportId: UUID,
    user: AuthenticatedUser
): Report {
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

fun Handle.putReport(
    id: UUID,
    report: Report.Companion.ReportInput,
    user: AuthenticatedUser
): Report {
    return createQuery(
        """
            WITH report AS (
                UPDATE report 
                 SET name = :name, description = :description, updated_by = :updatedBy
                 WHERE id = :id AND (created_by = :updatedBy OR updated_by = :updatedBy)
                RETURNING *
            ) 
            $SELECT_REPORT_SQL
            """
    )
        .bind("id", id)
        .bind("name", report.name)
        .bind("description", report.description)
        .bind("updatedBy", user.id)
        .mapTo<Report>()
        .findOne()
        .getOrNull() ?: throw NotFound()
}

fun Handle.getReport(
    id: UUID,
    user: AuthenticatedUser
) = createQuery(
    """
                $SELECT_REPORT_SQL
                WHERE r.id = :id AND (r.created_by = :userId OR r.updated_by = :userId)
            """
)
    .bind("id", id)
    .bind("userId", user.id)
    .mapTo<Report>()
    .findOne()
    .getOrNull() ?: throw NotFound()

fun Handle.getReports(user: AuthenticatedUser) =
    createQuery(
        """
                $SELECT_REPORT_SQL
                WHERE r.created_by = :userId OR r.updated_by = :userId
                ORDER BY r.created DESC
            """
    )
        .bind("userId", user.id)
        .mapTo<Report>()
        .list() ?: emptyList()


fun getTableDefinitionByDocumentType(documentType: DocumentType) =
    when (documentType) {
        DocumentType.LIITO_ORAVA_PISTEET -> TableDefinition.LiitoOravaPisteet
        DocumentType.LIITO_ORAVA_ALUEET -> TableDefinition.LiitoOravaAlueet
        DocumentType.LIITO_ORAVA_VIIVAT -> TableDefinition.LiitoOravaYhteysviivat
        else -> null
    }
