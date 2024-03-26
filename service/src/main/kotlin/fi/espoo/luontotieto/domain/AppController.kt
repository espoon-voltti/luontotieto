// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.audit
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
class AppController {
    @Autowired
    lateinit var jdbi: Jdbi

    private val logger = KotlinLogging.logger {}

    data class StudentAndCaseInput(
        val student: StudentInput,
    )

    @PostMapping("/students")
    fun createStudent(
        user: AuthenticatedUser,
        @RequestBody body: StudentAndCaseInput
    ): UUID {
        return jdbi.inTransactionUnchecked { tx ->
            val studentId = tx.insertStudent(data = body.student, user = user)
            studentId
        }.also {
            logger.audit(
                user,
                "CREATE_STUDENT"
            )
        }
    }

    data class StudentResponse(
        val student: Student,
    )

    @GetMapping("/students/{id}")
    fun getStudent(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): StudentResponse {
        return jdbi.inTransactionUnchecked { tx ->
            val studentDetails = tx.getStudent(id = id)
            StudentResponse(studentDetails)
        }.also {
            logger.audit(
                user,
                "GET_STUDENT",
                mapOf("studentId" to id.toString())
            )
        }
    }
}
