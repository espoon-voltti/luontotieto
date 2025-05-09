// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.ReportController
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.FileInputStream
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class ReportFileTests : FullApplicationTest() {
    @Autowired
    lateinit var controller: ReportController

    @Autowired
    lateinit var orderController: OrderController

    @Test
    fun `create report files and fetch and delete`() {
        val createOrderResponse = createOrderAndReport(orderController)

        createLiitoOravaPisteetReportFile(controller, createOrderResponse.reportId)

        val reportFileResponse =
            controller.getReportFiles(customerUser, createOrderResponse.reportId)

        assertNotNull(reportFileResponse)
        assertEquals(reportFileResponse.count(), 1)
        val fileResponse = reportFileResponse.first()
        assertEquals("Test Description", fileResponse.description)
        assertEquals("liito_orava_pisteet.gpkg", fileResponse.fileName)
        assertEquals(DocumentType.LIITO_ORAVA_PISTEET, fileResponse.documentType)
        assertEquals("application/x-geopackage", fileResponse.mediaType)
        assertEquals(adminUser.id, fileResponse.createdBy)
        assertEquals(adminUser.id, fileResponse.updatedBy)

        controller.deleteReportFile(
            user = customerUser,
            reportId = createOrderResponse.reportId,
            fileId = fileResponse.id
        )

        val reportFileResponseAfterDelete =
            controller.getReportFiles(customerUser, createOrderResponse.reportId)
        assertEquals(0, reportFileResponseAfterDelete.count())
    }

    @Test
    fun `create report files - bad request`() {
        val createOrderResponse = createOrderAndReport(orderController)
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
                user = adminUser,
                reportId = createOrderResponse.reportId,
                file = multipartFile,
                documentType = DocumentType.LIITO_ORAVA_PISTEET,
                description = "Test Description",
                id = UUID.randomUUID().toString()
            )

        val errors = response.body
        assertTrue(errors?.isNotEmpty() == true)

        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        val reportFileResponse =
            controller.getReportFiles(customerUser, createOrderResponse.reportId)

        assertNotNull(reportFileResponse)
        assertEquals(0, reportFileResponse.count())
    }

    @Test
    fun `create report files - pdf document`() {
        val createOrderResponse = createOrderAndReport(orderController)
        val response =
            controller.uploadReportFile(
                user = adminUser,
                reportId = createOrderResponse.reportId,
                file =
                    MockMultipartFile(
                        "selvitys.pdf",
                        "selvitys.pdf",
                        "application/pdf",
                        "TEST FILE CONTENT".toByteArray()
                    ),
                documentType = DocumentType.REPORT,
                description = "Test Description",
                id = UUID.randomUUID().toString()
            )

        val errors = response.body
        assertTrue(errors?.isEmpty() == true)
        assertEquals(HttpStatus.CREATED, response.statusCode)

        controller.uploadReportFile(
            user = adminUser,
            reportId = createOrderResponse.reportId,
            file =
                MockMultipartFile(
                    "lisatieto.pdf",
                    "lisatieto.pdf",
                    "application/pdf",
                    "MORE INFORMATION".toByteArray()
                ),
            documentType = DocumentType.OTHER,
            description = "Test Description",
            id = UUID.randomUUID().toString()
        )

        val reportFileResponse = controller.getReportFiles(adminUser, createOrderResponse.reportId)

        assertNotNull(reportFileResponse)
        assertEquals(2, reportFileResponse.count())

        val s3Doc =
            controller.documentClient.get(
                controller.bucketEnv.data,
                "${createOrderResponse.reportId}/${reportFileResponse.first { it.fileName == "selvitys.pdf" }.id}"
            )
        assertEquals("TEST FILE CONTENT", String(s3Doc.bytes))
    }
}
