// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.FileExtension
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.Report
import fi.espoo.luontotieto.domain.ReportController
import fi.espoo.luontotieto.domain.UserRole
import fi.espoo.luontotieto.domain.getAluerajausLuontoselvitysParams
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.jdbi.v3.core.kotlin.mapTo
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import java.io.File
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ReportTests : FullApplicationTest() {
    @Autowired lateinit var reportController: ReportController

    @Autowired lateinit var orderController: OrderController

    @Test
    fun `create report with all data and fetch`() {
        val createOrderResponse =
            createOrderAndReport(controller = orderController, name = "Test report")
        val reportResponse = reportController.getReportById(adminUser, createOrderResponse.reportId)

        assertNotNull(reportResponse)
        assertEquals("Test report", reportResponse.name)
        assertEquals("Teija Testaaja", reportResponse.createdBy)
        assertEquals("Teija Testaaja", reportResponse.updatedBy)
    }

    @Test
    fun `get all reports for user`() {
        for (i in 0..2) {
            createOrderAndReport(
                controller = orderController,
                name = "Test report $i",
                description = "Test description"
            )
        }

        val expected = setOf("Test report 1", "Test report 2", "Test report 0")
        val reportsResponse = reportController.getReports(adminUser).map { it.name }.toSet()

        assertEquals(expected, reportsResponse)
    }

    @Test
    fun `get all reports for user - no reports`() {
        for (i in 0..2) {
            createOrderAndReport(
                controller = orderController,
                name = "Test report $i",
                description = "Test description"
            )
        }

        val reportsResponse =
            reportController.getReports(AuthenticatedUser(UUID.randomUUID(), UserRole.CUSTOMER))
        assertEquals(0, reportsResponse.size)
    }

    @Test
    fun `update existing report`() {
        val createOrderResponse =
            createOrderAndReport(
                controller = orderController,
                name = "Original name",
                description = "Original description"
            )

        val report = reportController.getReportById(customerUser, createOrderResponse.reportId)

        val updatedReport =
            reportController.updateReport(
                adminUser,
                report.id,
                Report.Companion.ReportInput(
                    "New name",
                    isPublic = true,
                    listOf(DocumentType.LIITO_ORAVA_VIIVAT)
                )
            )
        assertEquals("New name", updatedReport.name)
        assertEquals(listOf(DocumentType.LIITO_ORAVA_VIIVAT), updatedReport.noObservations)
        assertNotEquals(report.updated, updatedReport.updated)
        assertEquals(report.created, updatedReport.created)
        assertEquals(true, updatedReport.isPublic)
    }

    @Test
    fun `create, approve and reopen report`() {
        val createOrderResponse =
            createOrderAndReport(
                controller = orderController,
                name = "Original name",
                description = "Original description",
                reportDocuments =
                    listOf(
                        OrderReportDocument(
                            description = "Liito-orava viivat",
                            DocumentType.LIITO_ORAVA_VIIVAT
                        ),
                        OrderReportDocument(
                            description = "Muut huomioitavat lajit viivat",
                            DocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT
                        ),
                        OrderReportDocument(
                            description = "Muut huomioitavat lajit alueet",
                            DocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET
                        ),
                        OrderReportDocument(
                            description = "Muut huomioitavat lajit pisteet",
                            DocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET
                        )
                    )
            )

        val reportInput =
            Report.Companion.ReportInput(
                name = "Test report",
                isPublic = false,
                noObservations = listOf(DocumentType.LIITO_ORAVA_VIIVAT)
            )

        reportController.updateReport(adminUser, createOrderResponse.reportId, reportInput)

        File("src/test/resources/test-data/muut_huomioitavat_lajit_alueet_torakka.gpkg")
            .inputStream()
            .use { inStream ->
                assertEquals(
                    reportController
                        .uploadReportFile(
                            user = adminUser,
                            reportId = createOrderResponse.reportId,
                            file =
                                MockMultipartFile(
                                    "muut_huomioitavat_lajit_alueet_torakka.gpkg",
                                    "muut_huomioitavat_lajit_alueet_torakka.gpkg",
                                    "application/geopackage+sqlite3",
                                    inStream
                                ),
                            description = null,
                            documentType =
                                DocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET,
                            id = UUID.randomUUID().toString()
                        )
                        .statusCode
                        .value(),
                    201
                )
            }

        File("src/test/resources/test-data/muut_huomioitavat_lajit_viivat_perhonen.gpkg")
            .inputStream()
            .use { inStream ->
                assertEquals(
                    reportController
                        .uploadReportFile(
                            user = adminUser,
                            reportId = createOrderResponse.reportId,
                            file =
                                MockMultipartFile(
                                    "muut_huomioitavat_lajit_viivat_perhonen.gpkg",
                                    "muut_huomioitavat_lajit_viivat_perhonen.gpkg",
                                    "application/geopackage+sqlite3",
                                    inStream
                                ),
                            description = null,
                            documentType =
                                DocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT,
                            id = UUID.randomUUID().toString()
                        )
                        .statusCode
                        .value(),
                    201
                )
            }

        File("src/test/resources/test-data/muut_huomioitavat_lajit_pisteet_ilves.gpkg")
            .inputStream()
            .use { inStream ->
                assertEquals(
                    reportController
                        .uploadReportFile(
                            user = adminUser,
                            reportId = createOrderResponse.reportId,
                            file =
                                MockMultipartFile(
                                    "muut_huomioitavat_lajit_pisteet_ilves.gpkg",
                                    "muut_huomioitavat_lajit_pisteet_ilves.gpkg",
                                    "application/geopackage+sqlite3",
                                    inStream
                                ),
                            description = null,
                            documentType =
                                DocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET,
                            id = UUID.randomUUID().toString()
                        )
                        .statusCode
                        .value(),
                    201
                )
            }

        File("src/test/resources/test-data/aluerajaus_luontoselvitys.gpkg").inputStream().use {
                inStream ->
            assertEquals(
                reportController
                    .uploadReportFile(
                        user = adminUser,
                        reportId = createOrderResponse.reportId,
                        file =
                            MockMultipartFile(
                                "aluerajaus_luontoselvitys.gpkg",
                                "aluerajaus_luontoselvitys.gpkg",
                                "application/geopackage+sqlite3",
                                inStream
                            ),
                        description =
                            "Alueelta löytyi ilves, torakka, jänis ja perhonen.",
                        documentType = DocumentType.ALUERAJAUS_LUONTOSELVITYS,
                        id = UUID.randomUUID().toString()
                    )
                    .statusCode
                    .value(),
                201
            )
        }

        assertEquals(
            reportController
                .uploadReportFile(
                    user = adminUser,
                    reportId = createOrderResponse.reportId,
                    file =
                        MockMultipartFile(
                            "luontoselvitysraportti.pdf",
                            "luontoselvitysraportti.pdf",
                            "plain/text",
                            "LUONTOSELVITYSRAPORTTI".toByteArray()
                        ),
                    description = null,
                    documentType = DocumentType.REPORT,
                    id = UUID.randomUUID().toString()
                )
                .statusCode
                .value(),
            201
        )

        reportController.approveReport(adminUser, createOrderResponse.reportId, true)

        val approvedReport = reportController.getReportById(adminUser, createOrderResponse.reportId)
        assertTrue(approvedReport.approved)
        assertEquals(
            approvedReport.observedSpecies,
            listOf("Ilves", "Torakka", "Jänis", "Perhonen")
        )

        val reportFiles = reportController.getReportFiles(adminUser, createOrderResponse.reportId)
        assertEquals(5, reportFiles.size)

        reportController.paikkatietoJdbi.inTransactionUnchecked { ptx ->
            data class AluerajausResult(
                val lisatieto: String?,
                val selvitetytTiedot: List<String>,
                val selvitysRaporttiLinkki: String
            )

            val data =
                ptx.createQuery(
                    """
                    SELECT lisatieto, selvitetyt_tiedot AS "selvitetytTiedot", selvitys_raportti_linkki AS "selvitysRaporttiLinkki" FROM aluerajaus_luontoselvitys WHERE selvitys_id = :reportId
                    """.trimIndent()
                )
                    .bind("reportId", createOrderResponse.reportId)
                    .mapTo<AluerajausResult>()
                    .one()

            assertEquals("Alueelta löytyi ilves, torakka, jänis ja perhonen.", data.lisatieto)
            assertEquals(
                listOf(
                    "Liito-orava (ei havaittu)",
                    "Muut huomioitavat lajit (havaittu; Ilves, Jänis, Perhonen, Torakka)"
                ),
                data.selvitetytTiedot
            )
            assertEquals("Ei julkinen", data.selvitysRaporttiLinkki)

            val viitteet =
                ptx.createQuery(
                    """
                    SELECT viite FROM muut_huomioitavat_lajit_pisteet WHERE selvitys_id = :reportId
                    """.trimIndent()
                )
                    .bind("reportId", createOrderResponse.reportId)
                    .mapTo<String>()
                    .toList()

            assertEquals(viitteet, listOf("over-written", "Test report"))
        }

        reportController.reopenReport(adminUser, createOrderResponse.reportId)

        val reopenedReport = reportController.getReportById(adminUser, createOrderResponse.reportId)
        assertFalse(reopenedReport.approved)

        reportController.paikkatietoJdbi.inTransactionUnchecked { ptx ->
            val aluerajausRows =
                ptx.createQuery(
                    """
                    SELECT selvitys_id FROM aluerajaus_luontoselvitys WHERE selvitys_id = :reportId
                    """.trimIndent()
                )
                    .bind("reportId", createOrderResponse.reportId)
                    .mapTo<String>()

            assertEquals(aluerajausRows.count(), 0)

            val muutHuomioitavatLajitPisteet =
                ptx.createQuery(
                    """
                    SELECT selvitys_id FROM muut_huomioitavat_lajit_pisteet WHERE selvitys_id = :reportId
                    """.trimIndent()
                )
                    .bind("reportId", createOrderResponse.reportId)
                    .mapTo<String>()

            assertEquals(muutHuomioitavatLajitPisteet.count(), 0)
        }
    }

    @Test
    fun `test that uploading DocumentType_REPORT with extension txt throws error`() {
        val createOrderResponse =
            createOrderAndReport(
                controller = orderController,
                name = "Original name",
                description = "Original description",
                reportDocuments =
                    DocumentType.entries.mapNotNull {
                        if (it.fileExtension == FileExtension.GPKG) {
                            OrderReportDocument(description = it.name, it)
                        } else {
                            null
                        }
                    }
            )

        for (documentType in DocumentType.entries) {
            if (documentType == DocumentType.OTHER) {
                continue
            }
            assertFailsWith(BadRequest::class) {
                reportController.uploadReportFile(
                    user = adminUser,
                    reportId = createOrderResponse.reportId,
                    file =
                        MockMultipartFile(
                            "text-file.txt",
                            "text-file.txt",
                            "plain/text",
                            "This is a text file".toByteArray()
                        ),
                    description = null,
                    documentType = documentType,
                    id = UUID.randomUUID().toString()
                )
            }
        }
    }

    @Test
    fun `test that getAluerajausLuontoselvitysParams returns correct parameters`() {
        val createOrderResponse =
            createOrderAndReport(controller = orderController, name = "Test report")
        val reportResponse = reportController.getReportById(adminUser, createOrderResponse.reportId)

        val expected =
            mapOf(
                "name" to reportResponse.name,
                "year" to reportResponse.order?.returnDate?.year,
                "contactPerson" to reportResponse.order?.assignee,
                "unit" to reportResponse.order?.orderingUnit?.joinToString(","),
                "additionalInformation" to null,
                "reportLink" to "linkki",
                "reportDocumentLink" to "raporttilinkki",
                "surveyedData" to arrayOf("Tiikeri")
            )
        val params =
            reportController.jdbi.inTransactionUnchecked { tx ->
                tx.getAluerajausLuontoselvitysParams(
                    adminUser,
                    reportResponse.id,
                    listOf("Tiikeri").toSet(),
                    "linkki",
                    "raporttilinkki"
                )
            }
        assertEquals(expected["name"], params["name"])
        assertEquals(expected["year"], params["year"])
        assertEquals(expected["contactPerson"], params["contactPerson"])
        assertEquals(expected["unit"], params["unit"])
        assertEquals(expected["additionalInformation"], params["additionalInformation"])
        assertEquals(expected["reportLink"], params["reportLink"])
        assertEquals(expected["reportDocumentLink"], params["reportDocumentLink"])
    }

    @Test
    fun `test that getAluerajausLuontoselvitysParams contact person overwriting works`() {
        val createOrderResponse =
            createOrderAndReport(
                controller = orderController,
                name = "Test report",
                assigneeCompanyName = "Ylikirjoitus Oy"
            )
        val reportResponse = reportController.getReportById(adminUser, createOrderResponse.reportId)

        val expected =
            mapOf(
                "name" to reportResponse.name,
                "year" to reportResponse.order?.returnDate?.year,
                "contactPerson" to "Ylikirjoitus Oy",
                "unit" to reportResponse.order?.orderingUnit?.joinToString(","),
                "additionalInformation" to null,
                "reportLink" to "linkki",
                "reportDocumentLink" to "raporttilinkki",
                "surveyedData" to arrayOf("Tiikeri")
            )
        val params =
            reportController.jdbi.inTransactionUnchecked { tx ->
                tx.getAluerajausLuontoselvitysParams(
                    adminUser,
                    reportResponse.id,
                    listOf("Tiikeri").toSet(),
                    "linkki",
                    "raporttilinkki"
                )
            }
        assertEquals(expected["name"], params["name"])
        assertEquals(expected["year"], params["year"])
        assertEquals(expected["contactPerson"], params["contactPerson"])
        assertEquals(expected["unit"], params["unit"])
        assertEquals(expected["additionalInformation"], params["additionalInformation"])
        assertEquals(expected["reportLink"], params["reportLink"])
        assertEquals(expected["reportDocumentLink"], params["reportDocumentLink"])
    }
}
