// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.Report
import fi.espoo.luontotieto.domain.ReportController
import fi.espoo.luontotieto.domain.UserRole
import org.springframework.beans.factory.annotation.Autowired
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull

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
                Report.Companion.ReportInput("New name", null)
            )
        assertEquals("New name", updatedReport.name)
        assertNotEquals(report.updated, updatedReport.updated)
        assertEquals(report.created, updatedReport.created)
    }
}
