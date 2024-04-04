// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.audit
import fi.espoo.paikkatieto.domain.LiitoOravaAlueet
import fi.espoo.paikkatieto.domain.LiitoOravaPisteet
import fi.espoo.paikkatieto.domain.LiitoOravaYhteysviivat
import fi.espoo.paikkatieto.domain.insertLiitoOravaAlueet
import fi.espoo.paikkatieto.domain.insertLiitoOravaPisteet
import fi.espoo.paikkatieto.domain.insertLiitoOravaYhteysviivat
import fi.espoo.paikkatieto.reader.GpkgReader
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.io.File
import java.util.UUID

@RestController
class AppController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    @Qualifier("jdbi-paikkatieto")
    @Autowired
    lateinit var paikkatietoJdbi: Jdbi

    private val logger = KotlinLogging.logger {}

    @PostMapping("/file")
    fun uploadFile(): String {
        val reader1 =
            GpkgReader(
                File("src/test/resources/test-data/liito_orava_pisteet.gpkg"),
                LiitoOravaPisteet
            )
        val data1 = reader1.asSequence()

        val reader2 =
            GpkgReader(
                File("src/test/resources/test-data/liito_orava_alueet.gpkg"),
                LiitoOravaAlueet
            )
        val data2 = reader2.asSequence()

        val reader3 =
            GpkgReader(
                File("src/test/resources/test-data/liito_orava_yhteysviivat.gpkg"),
                LiitoOravaYhteysviivat
            )
        val data3 = reader3.asSequence()

        paikkatietoJdbi.inTransactionUnchecked { tx ->
            tx.insertLiitoOravaPisteet(data1)
            tx.insertLiitoOravaAlueet(data2)
            tx.insertLiitoOravaYhteysviivat(data3)
        }

        reader1.close()
        reader2.close()
        reader3.close()

        return "OK"
    }

    @PostMapping("/reports")
    fun createReportFromScratch(
        user: AuthenticatedUser,
        @RequestBody body: ReportInput
    ): Report {
        return jdbi
            .inTransactionUnchecked { tx -> tx.insertReport(data = body, user = user) }
            .also { logger.audit(user, "CREATE_REPORT") }
    }

    @GetMapping("/reports/{id}")
    fun getReportById(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): Report {
        return jdbi.inTransactionUnchecked { tx -> tx.getReport(id, user) }
    }

    // TODO: Remove
    data class StudentAndCaseInput(
        val student: StudentInput,
    )

    @PostMapping("/students")
    fun createStudent(
        user: AuthenticatedUser,
        @RequestBody body: StudentAndCaseInput
    ): UUID {
        return jdbi
            .inTransactionUnchecked { tx ->
                val studentId = tx.insertStudent(data = body.student, user = user)
                studentId
            }
            .also { logger.audit(user, "CREATE_STUDENT") }
    }

    data class StudentResponse(
        val student: Student,
    )

    @GetMapping("/students/{id}")
    fun getStudent(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): StudentResponse {
        return jdbi
            .inTransactionUnchecked { tx ->
                val studentDetails = tx.getStudent(id = id)
                StudentResponse(studentDetails)
            }
            .also { logger.audit(user, "GET_STUDENT", mapOf("studentId" to id.toString())) }
    }
}
