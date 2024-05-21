// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.AdUser
import fi.espoo.luontotieto.common.AppUser
import fi.espoo.luontotieto.common.Unauthorized
import fi.espoo.luontotieto.common.getAppUser
import fi.espoo.luontotieto.common.getAppUserWithPassword
import fi.espoo.luontotieto.common.upsertAppUserFromAd
import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.audit
import fi.espoo.luontotieto.domain.UserRole
import mu.KotlinLogging
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class PasswordUser(val email: String, val password: String)

/**
 * Controller for "system" endpoints intended to be only called from api-gateway as the system
 * internal user
 */
@RestController
@RequestMapping("/system")
class SystemController {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    lateinit var jdbi: Jdbi

    private val logger = KotlinLogging.logger {}

    @PostMapping("/user-login")
    fun adLogin(
        user: AuthenticatedUser,
        @RequestBody adUser: AdUser
    ): AppUser {
        return jdbi
            .inTransactionUnchecked {
                val appUser = it.upsertAppUserFromAd(adUser, user)
                if (!appUser.active) {
                    logger.info("Login attempt failed. User is inactive.")
                    throw Unauthorized()
                }
                appUser
            }
            .also { logger.audit(user, AuditEvent.USER_LOGIN) }
    }

    @PostMapping("/password-login")
    fun passwordLogin(
        @RequestBody passwordUser: PasswordUser
    ): AppUser {
        return jdbi
            .inTransactionUnchecked {
                val user = it.getAppUserWithPassword(passwordUser.email)
                if (user == null) {
                    logger.info("Login attempt failed. Invalid email.")
                    throw Unauthorized()
                }
                if (!user.active) {
                    logger.info("Login attempt failed. User is inactive.")
                    throw Unauthorized()
                }

                val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()

                if (!encoder.matches(passwordUser.password, user.password)) {
                    logger.info("Login attempt failed. Invalid password.")
                    throw Unauthorized()
                }
                user.toAppUser()
            }
            .also {
                logger.audit(AuthenticatedUser(it.id, UserRole.CUSTOMER), AuditEvent.PASSWORD_LOGIN)
            }
    }

    @GetMapping("/users/{id}")
    fun getUser(
        @PathVariable id: UUID
    ): AppUser? {
        return jdbi.inTransactionUnchecked { it.getAppUser(id) }
    }
}
