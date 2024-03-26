// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.common.UserBasics
import fi.espoo.luontotieto.common.isUniqueConstraintViolation
import fi.espoo.luontotieto.domain.AppController
import fi.espoo.luontotieto.domain.Student
import fi.espoo.luontotieto.domain.StudentInput

import minimalStudentAndCaseTestInput
import minimalStudentTestInput
import org.jdbi.v3.core.statement.UnableToExecuteStatementException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import testUser
import testUserName
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class StudentTests : FullApplicationTest() {
    @Autowired
    lateinit var controller: AppController


    @Test
    fun `create student with all data and fetch`() {
        val studentId =
            controller.createStudent(
                user = testUser,
                body =
                    AppController.StudentAndCaseInput(
                        student =
                            StudentInput(
                                firstName = "Testi",
                                lastName = "Testilä"
                            ),
                    )
            )

        val studentResponse = controller.getStudent(testUser, studentId)
        assertEquals(
            Student(
                id = studentId,
                firstName = "Testi",
                lastName = "Testilä",
            ),
            studentResponse.student
        )

    }
}
