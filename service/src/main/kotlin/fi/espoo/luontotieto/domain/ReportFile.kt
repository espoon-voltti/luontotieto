// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.DatabaseEnum
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.paikkatieto.domain.TableDefinition
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.enums.DatabaseValue
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

object DocumentName {
    const val LIITO_ORAVA = "Liito-orava"
    const val MUUT_LAJIT = "Muut huomioitavat lajit"
    const val LEPAKKO = "Lepakko"
    const val LUMO = "Lumo"
    const val NORO = "Noro"
    const val LUONTOTYYPIT = "Luontotyypit"
    const val EKOYHTEYDET = "Ekoyhteydet"
    const val LAHTEET = "Lähteet"
    const val VIERASLAJIT = "Vieraslajit"
}

enum class FileExtension(
    val extension: String
) {
    PDF("pdf"),
    GPKG("gpkg");

    fun matches(extension: String): Boolean = extension == this.extension
}

enum class DocumentType(
    val tableDefinition: TableDefinition? = null,
    val documentName: String? = null,
    val fileExtension: FileExtension? = null
) : DatabaseEnum {
    @DatabaseValue("paikkatieto:liito_orava_pisteet")
    LIITO_ORAVA_PISTEET(
        TableDefinition.LIITO_ORAVA_PISTEET,
        DocumentName.LIITO_ORAVA,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:liito_orava_alueet")
    LIITO_ORAVA_ALUEET(
        TableDefinition.LIITO_ORAVA_ALUEET,
        DocumentName.LIITO_ORAVA,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:liito_orava_yhteysviivat")
    LIITO_ORAVA_VIIVAT(
        TableDefinition.LIITO_ORAVA_YHTEYSVIIVAT,
        DocumentName.LIITO_ORAVA,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:muut_huomioitavat_lajit_pisteet")
    MUUT_HUOMIOITAVAT_LAJIT_PISTEET(
        TableDefinition.MUUT_HUOMIOITAVAT_LAJIT_PISTEET,
        DocumentName.MUUT_LAJIT,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:muut_huomioitavat_lajit_alueet")
    MUUT_HUOMIOITAVAT_LAJIT_ALUEET(
        TableDefinition.MUUT_HUOMIOITAVAT_LAJIT_ALUEET,
        DocumentName.MUUT_LAJIT,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:muut_huomioitavat_lajit_viivat")
    MUUT_HUOMIOITAVAT_LAJIT_VIIVAT(
        TableDefinition.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT,
        DocumentName.MUUT_LAJIT,
        FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:aluerajaus_luontoselvitys")
    ALUERAJAUS_LUONTOSELVITYS(
        tableDefinition = TableDefinition.ALUERAJAUS_LUONTOSELVITYS,
        fileExtension = FileExtension.GPKG
    ),

    @DatabaseValue("paikkatieto:lepakko_viivat")
    LEPAKKO_VIIVAT(TableDefinition.LEPAKKO_VIIVAT, DocumentName.LEPAKKO, FileExtension.GPKG),

    @DatabaseValue("paikkatieto:lepakko_alueet")
    LEPAKKO_ALUEET(TableDefinition.LEPAKKO_ALUEET, DocumentName.LEPAKKO, FileExtension.GPKG),

    @DatabaseValue("paikkatieto:lumo_alueet")
    LUMO_ALUEET(TableDefinition.LUMO_ALUEET, DocumentName.LUMO, FileExtension.GPKG),

    @DatabaseValue("paikkatieto:noro_viivat")
    NORO_VIIVAT(TableDefinition.NORO_VIIVAT, DocumentName.NORO, FileExtension.GPKG),

    @DatabaseValue("paikkatieto:luontotyypit_alueet")
    LUONTOTYYPIT_ALUEET(TableDefinition.LUONTOTYYPIT_ALUEET, DocumentName.LUONTOTYYPIT),

    @DatabaseValue("paikkatieto:ekoyhteydet_alueet")
    EKOYHTEYDET_ALUEET(TableDefinition.EKOYHTEYDET_ALUEET, DocumentName.EKOYHTEYDET),

    @DatabaseValue("paikkatieto:ekoyhteydet_viivat")
    EKOYHTEYDET_VIIVAT(TableDefinition.EKOYHTEYDET_VIIVAT, DocumentName.EKOYHTEYDET),

    @DatabaseValue("paikkatieto:lahteet_pisteet")
    LAHTEET_PISTEET(TableDefinition.LAHTEET_PISTEET, DocumentName.LAHTEET),

    @DatabaseValue("paikkatieto:vieraslajit_alueet")
    VIERASLAJIT_ALUEET(TableDefinition.VIERASLAJIT_ALUEET, DocumentName.VIERASLAJIT),

    @DatabaseValue("paikkatieto:vieraslajit_pisteet")
    VIERASLAJIT_PISTEET(TableDefinition.VIERASLAJIT_PISTEET, DocumentName.VIERASLAJIT),

    @DatabaseValue("luontotieto:report")
    REPORT(fileExtension = FileExtension.PDF),

    @DatabaseValue("luontotieto:other")
    OTHER;

    override val sqlType = "document_type"
}

data class ReportFile(
    val id: UUID,
    val description: String?,
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
    val fileId: UUID,
    val reportId: UUID,
    val description: String?,
    val mediaType: String,
    val fileName: String,
    val documentType: DocumentType
)

fun Handle.insertReportFile(
    data: ReportFileInput,
    user: AuthenticatedUser
): UUID =
    createUpdate(
        """
            INSERT INTO report_file (id, report_id, description, media_type, file_name, document_type, created_by, updated_by) 
            VALUES (:id, :reportId, :description, :mediaType, :fileName, :documentType, :createdBy, :updatedBy)
            RETURNING id
            """
    ).bind("id", data.fileId)
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
    ).bind("reportId", reportId)
        .bind("fileId", fileId)
        .mapTo<ReportFile>()
        .findOne()
        .getOrNull() ?: throw NotFound()

fun Handle.getReportDocumentForReport(reportId: UUID): ReportFile =
    createQuery(
        """
                SELECT report_file.id, report_file.description, report_file.report_id AS "reportId", report_file.media_type AS "mediaType", 
                report_file.file_name AS "fileName", report_file.document_type AS "documentType",
                report_file.created, report_file.updated,  report_file.created_by AS "createdBy", report_file.updated_by AS "updatedBy"
                FROM report_file
                RIGHT JOIN report
                ON report_file.report_id = report.id
                WHERE report.is_public = true 
                AND report.approved = true
                AND report_file.report_id = :reportId
                AND report_file.document_type = 'luontotieto:report'
            """
    ).bind("reportId", reportId)
        .mapTo<ReportFile>()
        .findOne()
        .getOrNull() ?: throw NotFound()

fun Handle.getReportFiles(reportId: UUID): List<ReportFile> =
    createQuery(
        """
                SELECT id, description, report_id AS "reportId", media_type AS "mediaType", 
                file_name AS "fileName", document_type AS "documentType",
                created, updated,  created_by AS "createdBy", updated_by AS "updatedBy"
                FROM report_file
                WHERE report_id = :reportId
            """
    ).bind("reportId", reportId)
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
    ).bind("reportId", reportId)
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
}
