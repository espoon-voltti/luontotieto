// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.common.Emails
import fi.espoo.luontotieto.common.HtmlSafe
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.LuontotietoHost
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.ses.Email
import fi.espoo.luontotieto.ses.SESEmailClient
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/users")
class UserController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    @Autowired
    lateinit var sesEmailClient: SESEmailClient

    @Autowired
    lateinit var luontotietoHost: LuontotietoHost

    private val logger = KotlinLogging.logger {}

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(
        user: AuthenticatedUser,
        @RequestBody body: User.Companion.CreateCustomerUser
    ): User {
        user.checkRoles(UserRole.ADMIN)
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val generatedString = generatePassword()
        val passwordHash = encoder.encode(generatedString)
        return jdbi
            .inTransactionUnchecked { tx ->
                val createdUser = tx.insertUser(data = body, user = user, passwordHash)
                sesEmailClient.send(
                    Email(
                        body.email,
                        Emails.getUserCreatedEmail(
                            luontotietoHost.getCustomerUserLoginUrl(),
                            HtmlSafe(createdUser.email ?: ""),
                            generatedString
                        )
                    )
                )

                createdUser
            }
            .also { logger.audit(user, AuditEvent.CREATE_USER, mapOf("id" to "$it")) }
    }

    @GetMapping("/{id}")
    fun getUser(
        user: AuthenticatedUser,
        @PathVariable id: UUID
    ): User {
        if (user.isSystemUser() || user.role == UserRole.ADMIN) {
            return jdbi.inTransactionUnchecked { tx -> tx.getUser(id) }.also {
                logger.audit(user, AuditEvent.GET_USER, mapOf("id" to "$id"))
            }
        } else {
            throw NotFound()
        }
    }

    @GetMapping()
    fun getUsers(
        user: AuthenticatedUser,
        @RequestParam includeInactive: Boolean = true
    ): List<User> {
        user.checkRoles(UserRole.ADMIN, UserRole.ORDERER)
        return jdbi
            .inTransactionUnchecked { tx ->
                tx.getUsers().filter { u ->
                    if (user.role === UserRole.ADMIN) {
                        includeInactive || u.active
                    } else {
                        (u.role === UserRole.CUSTOMER || u.id == user.id) && includeInactive ||
                            u.active
                    }
                }
            }
            .also { logger.audit(user, AuditEvent.GET_USERS) }
    }

    @PutMapping("/{id}")
    fun updateUser(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody data: User.Companion.UserInput
    ): User {
        user.checkRoles(UserRole.ADMIN)
        return jdbi.inTransactionUnchecked { tx -> tx.putUser(id, data, user) }.also {
            logger.audit(user, AuditEvent.UPDATE_USER, mapOf("id" to "$id"))
        }
    }

    @PutMapping("/password")
    fun updateUserPassword(
        user: AuthenticatedUser,
        @RequestBody data: User.Companion.UpdatePasswordPayload
    ): UUID {
        user.checkRoles(UserRole.CUSTOMER)

        if (!data.newPassword.matches("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{12,}\$".toRegex())) {
            throw BadRequest("User entered a weak new password.", "weak-password")
        }
        return jdbi
            .inTransactionUnchecked { tx ->
                val currentPassword = tx.getUserPasswordHash(user.id)
                val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()

                if (!encoder.matches(data.currentPassword, currentPassword)) {
                    logger.info("User entered invalid current password.")
                    throw BadRequest(
                        "User entered invalid current password.",
                        "wrong-current-password"
                    )
                }

                if (encoder.matches(data.newPassword, currentPassword)) {
                    logger.info("New password cannot be same as the current password.")
                    throw BadRequest(
                        "New password cannot be same as the current password.",
                        "new-password-already-in-use"
                    )
                }

                val passwordHash = encoder.encode(data.newPassword)
                val result = tx.putPassword(user.id, passwordHash, user)
                sesEmailClient.send(
                    Email(
                        result.email,
                        Emails.getUserPasswordUpdatedEmail(
                            luontotietoHost.getCustomerUserLoginUrl(),
                        )
                    )
                )
                result.id
            }
            .also {
                logger.audit(user, AuditEvent.UPDATE_USER_PASSWORD, mapOf("id" to "${user.id}"))
            }
    }

    @PutMapping("/{id}/password/reset")
    fun updateUserPassword(
        user: AuthenticatedUser,
        @PathVariable id: UUID,
    ): UUID {
        user.checkRoles(UserRole.ADMIN)
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val generatedString = generatePassword()
        val passwordHash = encoder.encode(generatedString)
        return jdbi
            .inTransactionUnchecked { tx ->
                val result = tx.putPassword(id, passwordHash, user)
                sesEmailClient.send(
                    Email(
                        result.email,
                        Emails.getPasswordResetedEmail(
                            luontotietoHost.getCustomerUserLoginUrl(),
                            generatedString
                        )
                    )
                )
                result.id
            }
            .also {
                logger.audit(user, AuditEvent.RESET_USER_PASSWORD, mapOf("id" to "${user.id}"))
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
