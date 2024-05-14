// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.audit
import java.util.UUID
import mu.KotlinLogging
import org.apache.commons.lang3.RandomStringUtils
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController {
    @Qualifier("jdbi-luontotieto") @Autowired lateinit var jdbi: Jdbi

    private val logger = KotlinLogging.logger {}

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(
            user: AuthenticatedUser,
            @RequestBody body: User.Companion.CreateCustomerUser
    ): User {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val generatedString = generatePassword()
        println("Password: $generatedString")
        val passwordHash = encoder.encode(generatedString)
        // TODO: communicate the password via email
        return jdbi
                .inTransactionUnchecked { tx ->
                    tx.insertUser(data = body, user = user, passwordHash)
                }
                .also { logger.audit(user, AuditEvent.CREATE_USER, mapOf("id" to "$it")) }
    }

    @GetMapping("/{id}")
    fun getUser(user: AuthenticatedUser, @PathVariable id: UUID): User {
        return jdbi.inTransactionUnchecked { tx -> tx.getUser(id, user) }
    }

    @GetMapping()
    fun getUsers(user: AuthenticatedUser): List<User> {
        return jdbi.inTransactionUnchecked { tx -> tx.getUsers() }
    }

    @PutMapping("/{id}")
    fun updateUser(
            user: AuthenticatedUser,
            @PathVariable id: UUID,
            @RequestBody data: User.Companion.UserInput
    ): User {
        return jdbi.inTransactionUnchecked { tx -> tx.putUser(id, data, user) }.also {
            logger.audit(user, AuditEvent.UPDATE_USER, mapOf("id" to "$id"))
        }
    }
}

private fun generatePassword(): String {
    return buildString {
        append(RandomStringUtils.randomAlphanumeric(6))
        append("-")
        append(RandomStringUtils.randomAlphanumeric(6))
        append("-")
        append(RandomStringUtils.randomAlphanumeric(6))
    }
}
