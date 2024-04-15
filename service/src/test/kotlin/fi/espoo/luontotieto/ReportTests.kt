// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.Report
import org.springframework.beans.factory.annotation.Autowired
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull

class ReportTests : FullApplicationTest() {
    @Autowired lateinit var controller: AppController

    @Test
    fun `create report with all data and fetch`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report", "Test description")
            )

        val reportResponse = controller.getReportById(testUser, createdReport.id)

        assertNotNull(reportResponse)
        assertEquals(createdReport, reportResponse)
        assertEquals("Test report", createdReport.name)
        assertEquals("Test description", createdReport.description)
        assertEquals("Teija Testaaja", createdReport.createdBy)
        assertEquals("Teija Testaaja", createdReport.updatedBy)
    }

    @Test
    fun `get all reports for user`() {
        for (i in 0..2) {
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report $i", "Test description")
            )
        }

        val expected = setOf("Test report 1", "Test report 2", "Test report 0")
        val reportsResponse = controller.getReports(testUser).map { it.name }.toSet()

        assertEquals(expected, reportsResponse)
    }

    @Test
    fun `get all reports for user - no reports`() {
        for (i in 0..2) {
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report $i", "Test description")
            )
        }

        val reportsResponse = controller.getReports(AuthenticatedUser(UUID.randomUUID()))
        assertEquals(0, reportsResponse.size)
    }

    @Test
    fun `update existing report`() {
        val report =
            controller.createReportFromScratch(
                testUser,
                Report.Companion.ReportInput("Original name", "Original description")
            )
        val updatedReport =
            controller.updateReport(
                testUser,
                report.id,
                Report.Companion.ReportInput("New name", "New description")
            )
        assertEquals("New name", updatedReport.name)
        assertEquals("New description", updatedReport.description)
        assertNotEquals(report.updated, updatedReport.updated)
        assertEquals(report.created, updatedReport.created)
    }
}
