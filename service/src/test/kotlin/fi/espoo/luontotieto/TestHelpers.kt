// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.ReportController
import fi.espoo.paikkatieto.reader.GpkgValidationError
import org.springframework.http.ResponseEntity
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.FileInputStream
import java.time.LocalDate
import java.util.UUID

fun createOrderAndReport(
    controller: OrderController,
    name: String = "Test order",
    description: String = "Test description",
    planNumber: List<String> = listOf("Plan 1", "Plan 2"),
    assignee: AuthenticatedUser = customerUser,
    reportDocuments: List<OrderReportDocument> =
        listOf(OrderReportDocument("Description", DocumentType.LIITO_ORAVA_PISTEET)),
    assigneeContactPerson: String = "Person Name",
    assigneeContactEmail: String = "person.name@example.com",
    returnDate: LocalDate = LocalDate.of(2030, 1, 1),
    contactEmail: String = "contact@example.com",
    contactPerson: String = "Contact Person",
    contactPhone: String = "04012345678",
    orderingUnit: List<String> = listOf("Orava yksikkö", "Karhuryhmä"),
    assigneeCompanyName: String? = null,
    orderYear: Int = 2030
): OrderController.CreateOrderResponse =
    controller.createOrderFromScratch(
        user = adminUser,
        body =
            OrderInput(
                name = name,
                description = description,
                planNumber = planNumber,
                assigneeId = assignee.id,
                reportDocuments = reportDocuments,
                assigneeContactPerson = assigneeContactPerson,
                assigneeContactEmail = assigneeContactEmail,
                assigneeCompanyName = assigneeCompanyName,
                returnDate = returnDate,
                contactEmail = contactEmail,
                contactPhone = contactPhone,
                contactPerson = contactPerson,
                orderingUnit = orderingUnit,
                year = orderYear
            )
    )

fun createLiitoOravaPisteetReportFile(
    controller: ReportController,
    reportId: UUID
): ResponseEntity<List<GpkgValidationError>> {
    val file = File("src/test/resources/test-data/liito_orava_pisteet.gpkg")
    val multipartFile: MultipartFile =
        MockMultipartFile(
            "liito_orava_pisteet.gpkg",
            "liito_orava_pisteet.gpkg",
            "application/x-sqlite3",
            FileInputStream(file)
        )

    return controller.uploadReportFile(
        user = adminUser,
        reportId = reportId,
        file = multipartFile,
        documentType = DocumentType.LIITO_ORAVA_PISTEET,
        description = "Test Description",
        id = UUID.randomUUID().toString()
    )
}
