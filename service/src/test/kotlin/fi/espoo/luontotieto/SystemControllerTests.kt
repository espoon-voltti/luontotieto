// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.AdUser
import fi.espoo.luontotieto.common.Unauthorized
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class SystemControllerTests : FullApplicationTest() {
    @Autowired lateinit var controller: SystemController

    @Test
    fun passwordLoginOk() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val password = "password.1A"
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET password_hash = :password WHERE id = :id")
                .bind("password", encoder.encode(password))
                .bind("id", customerUser.id)
                .execute()
        }

        val user = controller.passwordLogin(PasswordUser("yritys@example.com", password))
        assertEquals(customerUser.id, user.id)
    }

    @Test
    fun passwordLoginInvalidPassword() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val password = "password.1A"
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET password_hash = :password WHERE id = :id")
                .bind("password", encoder.encode(password))
                .bind("id", customerUser.id)
                .execute()
        }

        assertFailsWith(Unauthorized::class) {
            controller.passwordLogin(PasswordUser("yritys@example.com", "password.1B"))
        }
    }

    @Test
    fun passwordLoginInactive() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val password = "password.1A"
        jdbi.inTransactionUnchecked {
            it.createUpdate(
                "UPDATE users SET active = false, password_hash = :password WHERE id = :id"
            )
                .bind("password", encoder.encode(password))
                .bind("id", customerUser.id)
                .execute()
        }

        assertFailsWith(Unauthorized::class) {
            controller.passwordLogin(PasswordUser("yritys@example.com", password))
        }
    }

    @Test
    fun adLoginInactive() {
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET active = false WHERE id = :id")
                .bind("id", adminUser.id)
                .execute()
        }

        assertFailsWith(Unauthorized::class) {
            controller.adLogin(
                systemUser,
                AdUser(externalId = "test:01", name = "Teija Testaaja", email = null)
            )
        }
    }
}
