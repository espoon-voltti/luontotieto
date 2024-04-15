// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.Report
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.FileInputStream
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ReportFileTests : FullApplicationTest() {
    @Autowired lateinit var controller: AppController

    @Test
    fun `create report files and fetch and delete`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report", "Test description")
            )
        val file = File("src/test/resources/test-data/liito_orava_pisteet.gpkg")
        val multipartFile: MultipartFile =
            MockMultipartFile(
                "liito_orava_pisteet.gpkg",
                "liito_orava_pisteet.gpkg",
                "application/x-sqlite3",
                FileInputStream(file)
            )

        controller.uploadReportFile(
            user = testUser,
            reportId = createdReport.id,
            file = multipartFile,
            documentType = DocumentType.LIITO_ORAVA_PISTEET,
            description = "Test Description"
        )

        val reportFileResponse = controller.getReportFiles(createdReport.id)

        assertNotNull(reportFileResponse)
        assertEquals(reportFileResponse.count(), 1)
        val fileResponse = reportFileResponse.first()
        assertEquals("Test Description", fileResponse.description)
        assertEquals("liito_orava_pisteet.gpkg", fileResponse.fileName)
        assertEquals(DocumentType.LIITO_ORAVA_PISTEET, fileResponse.documentType)
        assertEquals("application/x-sqlite3", fileResponse.mediaType)
        assertEquals(testUser.id, fileResponse.createdBy)
        assertEquals(testUser.id, fileResponse.updatedBy)

        controller.deleteReportFile(reportId = createdReport.id, fileId = fileResponse.id)

        val reportFileResponseAfterDelete = controller.getReportFiles(createdReport.id)
        assertEquals(0, reportFileResponseAfterDelete.count())
    }

    @Test
    fun `create report files - bad request`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report", "Test description")
            )
        val file = File("src/test/resources/test-data/liito_orava_alueet.gpkg")
        val multipartFile: MultipartFile =
            MockMultipartFile(
                "liito_orava_pisteet.gpkg",
                "liito_orava_pisteet.gpkg",
                "application/x-sqlite3",
                FileInputStream(file)
            )

        val response =
            controller.uploadReportFile(
                user = testUser,
                reportId = createdReport.id,
                file = multipartFile,
                documentType = DocumentType.LIITO_ORAVA_PISTEET,
                description = "Test Description"
            )

        val errors = response.body
        assertTrue(errors?.isNotEmpty() == true)

        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        val reportFileResponse = controller.getReportFiles(createdReport.id)

        assertNotNull(reportFileResponse)
        assertEquals(0, reportFileResponse.count())
    }

    @Test
    fun `create report files - text document`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = Report.Companion.ReportInput("Test report", "Test description")
            )
        val response =
            controller.uploadReportFile(
                user = testUser,
                reportId = createdReport.id,
                file =
                    MockMultipartFile(
                        "selvitys.txt",
                        "selvitys.txt",
                        "text/plain",
                        "TEST FILE CONTENT".toByteArray()
                    ),
                documentType = DocumentType.REPORT,
                description = "Test Description"
            )

        val errors = response.body
        assertTrue(errors?.isEmpty() == true)
        assertEquals(HttpStatus.CREATED, response.statusCode)

        controller.uploadReportFile(
            user = testUser,
            reportId = createdReport.id,
            file =
                MockMultipartFile(
                    "lisatieto.txt",
                    "lisatieto.txt",
                    "text/plain",
                    "MORE INFORMATION".toByteArray()
                ),
            documentType = DocumentType.OTHER,
            description = "Test Description"
        )

        val reportFileResponse = controller.getReportFiles(createdReport.id)

        assertNotNull(reportFileResponse)
        assertEquals(2, reportFileResponse.count())

        val s3Doc =
            controller.documentClient.get(
                controller.bucketEnv.data,
                "${createdReport.id}/${reportFileResponse.first { it.fileName == "selvitys.txt" }.id}"
            )
        assertEquals("TEST FILE CONTENT", String(s3Doc.bytes))
    }
}
