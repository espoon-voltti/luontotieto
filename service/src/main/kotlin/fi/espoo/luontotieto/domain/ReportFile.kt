// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID


enum class DocumentType(val value: String){
    LIITO_ORAVA_PISTEET("paikkatieto:liito_orava_pisteet"),
    LIITO_ORAVA_ALUEET("paikkatieto:liito_orava_alueet"),
    LIITO_ORAVA_VIIVAT("paikkatieto:liito_orava_yhteysviivat"),
    REPORT("luontotieto:report"),
    OTHER("luontotieto:other"),
}

data class ReportFile(
    val id: UUID,
    val description: String,
    val mediaType: String,
    val fileName: String,
    val documentType: DocumentType,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: UUID,
    val updatedBy: UUID
)

data class ReportFileInput(val reportId: UUID, val description: String, val mediaType: String, val fileName: String, val documentType: DocumentType)

fun Handle.insertReportFile(
    data: ReportFileInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO report_file (report_id, description, media_type, file_name, document_type, created_by, updated_by) 
            VALUES (:reportId, :description, :mediaType, :fileName, :documentType::document_type, :createdBy, :updatedBy)
            RETURNING id
            """
    )
        .bind("reportId", data.reportId)
        .bind("description", data.description)
        .bind("mediaType", data.mediaType)
        .bind("fileName", data.fileName)
        .bind("documentType", data.documentType.value)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<UUID>()
        .one()
}


