// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.common.databaseValue
import fi.espoo.luontotieto.common.sanitizeCsvCellData
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.Nested
import java.math.BigDecimal
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class Report(
    val id: UUID,
    val name: String,
    val approved: Boolean,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val createdBy: String,
    val updatedBy: String,
    val isPublic: Boolean?,
    val noObservations: List<DocumentType>?,
    val observedSpecies: List<String>?,
    val cost: BigDecimal?,
    @Nested("o_") val order: Order?
) {
    companion object {
        data class ReportInput(
            val name: String,
            val isPublic: Boolean?,
            val noObservations: List<DocumentType>?
        )
    }
}

private const val SELECT_REPORT_SQL =
    """
    SELECT r.id                                       AS "id",
           r.name                                     AS "name",
           r.created                                  AS "created",
           r.updated                                  AS "updated",
           r.approved                                 AS "approved",
           r.no_observations                          AS "noObservations",
           r.is_public                                AS "isPublic",
           r.observed_species                         AS "observedSpecies",
           uc.name                                    AS "createdBy",
           uu.name                                    AS "updatedBy",
           r.order_id                                 AS "orderId",
           o.id                                       AS "o_id",
           o.name                                     AS "o_name",
           o.description                              AS "o_description",
           o.created                                  AS "o_created",
           o.updated                                  AS "o_updated",
           o.plan_number                              AS "o_planNumber",
           o.report_documents                         AS "o_reportDocuments",
           oua.name                                   AS "o_assignee",
           oua.role                                   AS "o_assigneeRole",
           o.assignee_id                              AS "o_assigneeId",
           ouc.name                                   AS "o_createdBy",
           ouu.name                                   AS "o_updatedBy",
           o.assignee_contact_person                  AS "o_assigneeContactPerson",
           o.assignee_contact_email                   AS "o_assigneeContactEmail",
           o.assignee_company_name                    AS "o_assigneeCompanyName",
           o.return_date                              AS "o_returnDate",
           o.contact_person                           AS "o_contactPerson",
           o.contact_phone                            AS "o_contactPhone",
           o.contact_email                            AS "o_contactEmail",
           o.ordering_unit                            AS "o_orderingUnit",
           r.approved                                 AS "o_hasApprovedReport",
           r.cost                                     AS "cost",
           o.year                                     AS "o_year"
    FROM report r
             LEFT JOIN users uc ON r.created_by = uc.id
             LEFT JOIN users uu ON r.updated_by = uu.id
             LEFT JOIN "order" o ON r.order_id = o.id
             LEFT JOIN users ouc ON o.created_by = ouc.id
             LEFT JOIN users ouu ON o.updated_by = ouu.id
             LEFT JOIN users oua ON o.assignee_id = oua.id
"""

fun Handle.insertReport(
    data: Report.Companion.ReportInput,
    user: AuthenticatedUser,
    orderI: UUID? = null
): Report =
    createQuery(
        """
            WITH report AS (
                INSERT INTO report (name, created_by, updated_by, order_id, is_public) 
                VALUES (:name, :createdBy, :updatedBy, :orderId, :isPublic)
                RETURNING *
            ) 
            $SELECT_REPORT_SQL
            """
    ).bind("name", data.name)
        .bind("isPublic", data.isPublic)
        .bind("orderId", orderI)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .mapTo<Report>()
        .one()

fun Handle.updateReportApproved(
    reportId: UUID,
    approve: Boolean,
    observedSpecies: List<String>,
    user: AuthenticatedUser,
    reportCost: BigDecimal? = null
): Report =
    createUpdate(
        """
            UPDATE report 
              SET
                approved = :approved,
                observed_species = :observedSpecies,
                updated_by = :updatedBy,
                cost = :cost
            WHERE id = :reportId
            """
    ).bind("reportId", reportId)
        .bind("approved", approve)
        .bind("observedSpecies", observedSpecies.toTypedArray())
        .bind("updatedBy", user.id)
        .bind("cost", reportCost)
        .executeAndReturnGeneratedKeys()
        .mapTo<Report>()
        .one()

fun Handle.putReport(
    id: UUID,
    report: Report.Companion.ReportInput,
    user: AuthenticatedUser
): Report {
    val noObservations = report.noObservations?.map { dt -> dt.databaseValue() }?.toTypedArray()
    return createQuery(
        """
            WITH report AS (
                UPDATE report r
                 SET name = :name, updated_by = :updatedBy, no_observations = :noObservations, is_public = :isPublic
                 FROM "order" o, users u
                WHERE r.id = :id AND u.id = :updatedBy AND (o.assignee_id = u.id OR u.role != 'yrityskäyttäjä')
                RETURNING r.*
            ) 
            $SELECT_REPORT_SQL
            """
    ).bind("name", report.name)
        .bind("isPublic", report.isPublic)
        .bind("noObservations", noObservations)
        .bind("id", id)
        .bind("updatedBy", user.id)
        .mapTo<Report>()
        .findOne()
        .getOrNull() ?: throw NotFound()
}

fun Handle.getReport(
    id: UUID,
    user: AuthenticatedUser
): Report =
    createQuery(
        """ 
                $SELECT_REPORT_SQL
                JOIN users u ON (u.id = :userId AND ((u.id = o.assignee_id) OR u.role != 'yrityskäyttäjä'))
                WHERE r.id = :id
            """
    ).bind("id", id)
        .bind("userId", user.id)
        .mapTo<Report>()
        .findOne()
        .getOrNull() ?: throw NotFound()

fun Handle.getReportByOrderId(
    orderId: UUID,
    user: AuthenticatedUser
): Report =
    createQuery(
        """ 
                $SELECT_REPORT_SQL
                JOIN users u ON (u.id = :userId AND ((u.id = o.assignee_id) OR u.role != 'yrityskäyttäjä'))
                WHERE o.id = :id
            """
    ).bind("id", orderId)
        .bind("userId", user.id)
        .mapTo<Report>()
        .findOne()
        .getOrNull() ?: throw NotFound()

fun Handle.getReports(
    user: AuthenticatedUser,
    startDate: LocalDate? = null,
    endDate: LocalDate? = null
): List<Report> {
    val whereClause = reportsDateWhereClause(startDate, endDate)
    return createQuery(
        """
                $SELECT_REPORT_SQL
                JOIN users u ON (u.id = :userId AND ((u.id = o.assignee_id) OR u.role != 'yrityskäyttäjä'))
                $whereClause
                ORDER BY r.created DESC
            """
    ).bind("userId", user.id)
        .apply {
            if (startDate !== null) {
                bind("startDate", startDate)
            }
            if (endDate !== null) {
                bind("endDate", endDate)
            }
        }.mapTo<Report>()
        .list() ?: emptyList()
}

fun Handle.getAluerajausLuontoselvitysTilausParams(
    report: Report,
    reportLink: String
): Map<String, Any?> =
    mapOf(
        "name" to report.order?.name,
        "contactPerson" to report.order?.contactPerson,
        "unit" to report.order?.orderingUnit?.joinToString(","),
        "reportId" to report.id,
        "reportLink" to reportLink,
        "reportStatus" to if (report.approved) "Hyväksytty" else "Lähetetty",
        "year" to report.order?.year
    )

fun Handle.getObservedSpecies(reportId: UUID): List<String> =
    createQuery(
        """
            SELECT suomenkielinen_nimi
            FROM muut_huomioitavat_lajit_alueet
            WHERE selvitys_id = :reportId
            UNION
            SELECT suomenkielinen_nimi
            FROM muut_huomioitavat_lajit_viivat
            WHERE selvitys_id = :reportId
            UNION
            SELECT suomenkielinen_nimi
            FROM muut_huomioitavat_lajit_pisteet
            WHERE selvitys_id = :reportId
            """
    ).bind("reportId", reportId)
        .mapTo<String>()
        .toList()

data class PaikkaTietoEnum(
    val name: String,
    val value: String
)

fun Handle.getPaikkaTietoEnums(): List<PaikkaTietoEnum> =
    createQuery(
        """
            SELECT
                t.typname AS name,
                e.enumlabel AS value
            FROM
                pg_type t
            JOIN
                pg_enum e ON t.oid = e.enumtypid
            JOIN
                pg_namespace n ON n.oid = t.typnamespace
            """
    ).mapTo<PaikkaTietoEnum>()
        .toList()

fun Handle.getAluerajausLuontoselvitysParams(
    user: AuthenticatedUser,
    id: UUID,
    observedSpecies: Set<String>,
    reportLink: String,
    reportDocumentLink: String
): Map<String, Any?> {
    val report = this.getReport(id, user)
    val reportFiles = this.getReportFiles(id)
    val reportAreaFile =
        reportFiles.firstOrNull { it.documentType === DocumentType.ALUERAJAUS_LUONTOSELVITYS }

    val observations = reportFiles.mapNotNull { it.documentType.documentName }.toSet()
    val noObservations =
        (report.noObservations?.map { it.documentName }?.toSet() ?: emptySet()).subtract(
            observations
        )

    val surveyedData =
        observations
            .map {
                if (it == DocumentName.MUUT_LAJIT) {
                    val species = observedSpecies.sorted().joinToString(", ")
                    "$it (havaittu; $species)"
                } else {
                    "$it (havaittu)"
                }
            }.plus(noObservations.map { "$it (ei havaittu)" })
            .sorted()
            .toTypedArray()

    val contactPerson = report.order?.assigneeCompanyName ?: report.order?.assignee

    return mapOf(
        "name" to report.name,
        "year" to report.order?.returnDate?.year,
        "contactPerson" to contactPerson,
        "unit" to report.order?.orderingUnit?.joinToString(","),
        "additionalInformation" to reportAreaFile?.description,
        "reportLink" to reportLink,
        "reportDocumentLink" to reportDocumentLink,
        "surveyedData" to surveyedData
    )
}

const val CSV_FIELD_SEPARATOR = ";"
const val CSV_RECORD_SEPARATOR = "\r\n"

fun reportsToCsv(reports: List<Report>): String {
    val csvHeader =
        listOf(
            "id",
            "tilauksen nimi",
            "hyväksytty",
            "selvitykseen liittyvät suunnitelmat",
            "tilaajayksikkö",
            "tilaaja",
            "tilauksen luontipvm",
            "tilausvuosi",
            "selvittäjä",
            "viimeisin muokkaaja",
            "viimeisin muokkauspvm",
            "selvitetyt tiedot",
            "muut huomioitavat lajit",
            "ei löydettyjä havaintoja",
            "selvityksen toteutunut hinta"
        ).joinToString(CSV_FIELD_SEPARATOR, postfix = CSV_RECORD_SEPARATOR)

    val csvContent = StringBuilder()
    csvContent.append(csvHeader)

    for (report in reports) {
        val planNumbers = sanitizeCsvCellData(report.order?.planNumber?.joinToString(",") ?: "")
        val orderingUnits = sanitizeCsvCellData(report.order?.orderingUnit?.joinToString(",") ?: "")
        val reportDocuments =

            sanitizeCsvCellData(
                report.order
                    ?.reportDocuments
                    ?.map { rd -> rd.documentType }
                    ?.joinToString(",") ?: ""
            )

        val observedSpecies = sanitizeCsvCellData(report.observedSpecies?.joinToString(",") ?: "")

        val noObservations = sanitizeCsvCellData(report.noObservations?.joinToString(",") ?: "")

        val assigneeOrCompany = sanitizeCsvCellData(report.order?.assigneeCompanyName ?: report.order?.assignee ?: "")

        csvContent
            .append(report.id)
            .append(CSV_FIELD_SEPARATOR)
            .append(sanitizeCsvCellData(report.name))
            .append(CSV_FIELD_SEPARATOR)
            .append(report.approved)
            .append(CSV_FIELD_SEPARATOR)
            .append(planNumbers)
            .append(CSV_FIELD_SEPARATOR)
            .append(orderingUnits)
            .append(CSV_FIELD_SEPARATOR)
            .append(sanitizeCsvCellData(report.createdBy))
            .append(CSV_FIELD_SEPARATOR)
            .append(report.created)
            .append(CSV_FIELD_SEPARATOR)
            .append(report.order?.year)
            .append(CSV_FIELD_SEPARATOR)
            .append(assigneeOrCompany)
            .append(CSV_FIELD_SEPARATOR)
            .append(sanitizeCsvCellData(report.updatedBy))
            .append(CSV_FIELD_SEPARATOR)
            .append(report.updated)
            .append(CSV_FIELD_SEPARATOR)
            .append(
                reportDocuments
            ).append(CSV_FIELD_SEPARATOR)
            .append(observedSpecies)
            .append(CSV_FIELD_SEPARATOR)
            .append(noObservations)
            .append(CSV_FIELD_SEPARATOR)
            .append(report.cost ?: "")
            .append(CSV_RECORD_SEPARATOR)
    }

    return csvContent.toString()
}

private fun reportsDateWhereClause(
    startDate: LocalDate?,
    endDate: LocalDate?
): String {
    val query = StringBuilder()
    if (startDate !== null) {
        query.append("WHERE cast(r.created as date) >= :startDate")
        if (endDate !== null) {
            query.append(" AND cast(r.created as date) <= :endDate")
        }
    } else {
        if (endDate !== null) {
            query.append("WHERE cast(r.created as date) <= :endDate")
        }
    }

    return query.toString()
}
