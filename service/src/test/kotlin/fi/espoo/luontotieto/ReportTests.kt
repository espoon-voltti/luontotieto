// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.ReportInput
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class ReportTests : FullApplicationTest() {
    @Autowired lateinit var controller: AppController

    @Test
    fun `create report with all data and fetch`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = ReportInput("Test report", "Test description")
            )

        val reportResponse = controller.getReportById(testUser, createdReport.id)

        assertNotNull(reportResponse)
        assertEquals(createdReport, reportResponse)
        assertEquals("Test report", createdReport.name)
        assertEquals("Test description", createdReport.description)
        assertEquals(testUser.id, createdReport.createdBy)
        assertEquals(testUser.id, createdReport.updatedBy)
    }
}
