// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.StudentInput
import java.time.LocalDate
import java.util.UUID

val testUser = AuthenticatedUser(UUID.randomUUID())
val testUserName = "Teija Testaaja"

val minimalStudentTestInput =
    StudentInput(
        firstName = "Testi",
        lastName = "Testilä"
    )
    
val minimalStudentAndCaseTestInput =
    AppController.StudentAndCaseInput(
        student = minimalStudentTestInput,
    )
