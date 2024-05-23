// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderInput
import fi.espoo.luontotieto.domain.OrderReportDocument
import java.time.LocalDate

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
    contactPhone: String = "04012345678"
): OrderController.CreateOrderResponse {
    return controller.createOrderFromScratch(
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
                returnDate = returnDate,
                contactEmail = contactEmail,
                contactPhone = contactPhone,
                contactPerson = contactPerson
            )
    )
}
