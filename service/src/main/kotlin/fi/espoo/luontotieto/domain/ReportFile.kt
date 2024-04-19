// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.DatabaseEnum
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.enums.DatabaseValue
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

enum class DocumentType : DatabaseEnum {
    @DatabaseValue("paikkatieto:liito_orava_pisteet")
    LIITO_ORAVA_PISTEET,

    @DatabaseValue("paikkatieto:liito_orava_alueet")
    LIITO_ORAVA_ALUEET,

    @DatabaseValue("paikkatieto:liito_orava_yhteysviivat")
    LIITO_ORAVA_VIIVAT,

    @DatabaseValue("luontotieto:report")
    REPORT,

    @DatabaseValue("luontotieto:other")
    OTHER;

    override val sqlType = "document_type"
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
    val updatedBy: UUID,
    val reportId: UUID
)

data class ReportFileInput(
    val reportId: UUID,
    val description: String,
    val mediaType: String,
    val fileName: String,
    val documentType: DocumentType
)

fun Handle.insertReportFile(
    data: ReportFileInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
            INSERT INTO report_file (report_id, description, media_type, file_name, document_type, created_by, updated_by) 
            VALUES (:reportId, :description, :mediaType, :fileName, :documentType, :createdBy, :updatedBy)
            RETURNING id
            """
    )
        .bind("reportId", data.reportId)
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

fun Handle.getReportFileById(
    reportId: UUID,
    fileId: UUID
): ReportFile =
    createQuery(
        """
                SELECT id, description, report_id AS "reportId", media_type AS "mediaType", 
                file_name AS "fileName", document_type AS "documentType",
                created, updated,  created_by AS "createdBy", updated_by AS "updatedBy"
                FROM report_file
                WHERE report_id = :reportId
                AND id = :fileId
            """
    )
        .bind("reportId", reportId)
        .bind("fileId", fileId)
        .mapTo<ReportFile>()
        .findOne()
        .getOrNull() ?: throw fi.espoo.luontotieto.common.NotFound()

fun Handle.getReportFiles(reportId: UUID): List<ReportFile> =
    createQuery(
        """
                SELECT id, description, report_id AS "reportId", media_type AS "mediaType", 
                file_name AS "fileName", document_type AS "documentType",
                created, updated,  created_by AS "createdBy", updated_by AS "updatedBy"
                FROM report_file
                WHERE report_id = :reportId
            """
    )
        .bind("reportId", reportId)
        .mapTo<ReportFile>()
        .list()

fun Handle.getPaikkaTietoReportFiles(reportId: UUID): List<ReportFile> =
    createQuery(
        """
                SELECT id, description, report_id AS "reportId", media_type AS "mediaType", 
                file_name AS "fileName", document_type AS "documentType",
                created, updated,  created_by AS "createdBy", updated_by AS "updatedBy"
                FROM report_file
                WHERE report_id = :reportId
                AND document_type::text ILIKE 'paikkatieto:%'
            """
    )
        .bind("reportId", reportId)
        .mapTo<ReportFile>()
        .list()

fun Handle.deleteReportFile(
    reportId: UUID,
    fileId: UUID
) {
    createUpdate("DELETE FROM report_file WHERE id = :fileId AND report_id = :reportId")
        .bind("fileId", fileId)
        .bind("reportId", reportId)
        .execute()
        .also { if (it != 1) throw NotFound() }
}
