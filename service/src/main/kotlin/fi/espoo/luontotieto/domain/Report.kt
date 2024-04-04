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

data class Report(
    val id: UUID,
    val name: String,
    val description: String,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: UUID,
    val updatedBy: UUID
)

data class ReportInput(val name: String, val description: String)

fun Handle.insertReport(
    data: ReportInput,
    user: AuthenticatedUser
): Report {
    return createUpdate(
        """
            INSERT INTO report (name, description, created_by, updated_by) 
            VALUES (:name, :description, :createdBy, :updatedBy)
            RETURNING id, name, description, created, updated, created_by AS "createdBy", updated_by AS "updatedBy"
            """
    )
        .bind("name", data.name)
        .bind("description", data.description)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<Report>()
        .one()
}

fun Handle.getReport(
    id: UUID,
    user: AuthenticatedUser
) = createQuery(
    """
                SELECT id, name, description, created, updated, created_by AS "createdBy", updated_by AS "updatedBy"
                FROM report
                WHERE id = :id AND (created_by = :userId OR updated_by = :userId)
            """
)
    .bind("id", id)
    .bind("userId", user.id)
    .mapTo<Report>()
    .findOne()
    .getOrNull() ?: throw NotFound()

