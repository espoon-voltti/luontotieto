// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.ReportInput
import fi.espoo.luontotieto.s3.checkFileContentType
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.FileInputStream
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull


class ReportFileTests : FullApplicationTest() {
    @Autowired lateinit var controller: AppController

    @Test
    fun `create report files and fetch and delete`() {
        val createdReport =
            controller.createReportFromScratch(
                user = testUser,
                body = ReportInput("Test report", "Test description")
            )
        val file = File("src/test/resources/test-data/liito_orava_pisteet.gpkg")
//        val multipartFile: MultipartFile =
//            MockMultipartFile("liito_orava_pisteet.gpkg", FileInputStream(file))
        val fileStream = FileInputStream(file)
        val contentType = checkFileContentType(fileStream)
        val multipartFile: MultipartFile = MockMultipartFile("liito_orava_pisteet.gpkg", "liito_orava_pisteet.gpkg", contentType ,fileStream )

         controller.uploadReportFile(user = testUser,
            reportId = createdReport.id, file = multipartFile,
            documentType = DocumentType.LIITO_ORAVA_PISTEET, description = "Test Description" )

        val reportFileResponse = controller.getReportFiles(createdReport.id)

        assertNotNull(reportFileResponse)
        assertEquals(reportFileResponse.count(), 1)
        val fileResponse = reportFileResponse.first()
        assertEquals("Test description", fileResponse.description)
        assertEquals("liito_orava_pisteet.gpkg", fileResponse.fileName)
        assertEquals(DocumentType.LIITO_ORAVA_PISTEET, fileResponse.documentType)
        assertEquals("application/x-sqlite3", fileResponse.mediaType)
        assertEquals(testUser.id, fileResponse.createdBy)
        assertEquals(testUser.id, fileResponse.updatedBy)

        controller.deleteReportFile(reportId = createdReport.id, fileId = fileResponse.id)

        val reportFileResponseAfterDelete = controller.getReportFiles(createdReport.id)
        assertEquals(reportFileResponseAfterDelete.count(), 0)

    }

}
