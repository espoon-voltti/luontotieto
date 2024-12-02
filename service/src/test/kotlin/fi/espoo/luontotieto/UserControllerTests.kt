// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.User
import fi.espoo.luontotieto.domain.UserController
import fi.espoo.luontotieto.domain.UserRole
import fi.espoo.luontotieto.domain.getUserPasswordHash
import org.jdbi.v3.core.kotlin.inTransactionUnchecked
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class UserControllerTests : FullApplicationTest() {
    @Autowired
    lateinit var controller: UserController

    @Test
    fun createUserOk() {
        val createdUser =
            controller.createUser(
                adminUser,
                User.Companion.CreateCustomerUser("new-user@example.com", "Company Oy")
            )

        assertEquals(UserRole.CUSTOMER, createdUser.role)
        assertEquals("new-user@example.com", createdUser.email)
        assertEquals("Company Oy", createdUser.name)
        assertTrue(createdUser.active)
        createdUser.passwordUpdated?.let { assertFalse(it) }
    }

    @Test
    fun createUserUnauthorized() {
        for (role in UserRole.entries.filter { it != UserRole.ADMIN }) {
            val user = AuthenticatedUser(id = UUID.randomUUID(), role = role)
            val body = User.Companion.CreateCustomerUser("email@example.com", "Company Oy")
            assertFailsWith(NotFound::class) { controller.createUser(user, body) }
        }
    }

    @Test
    fun getUserOk() {
        assertEquals(customerUser.id, controller.getUser(systemUser, customerUser.id).id)
        assertEquals(customerUser.id, controller.getUser(adminUser, customerUser.id).id)
    }

    @Test
    fun getUserUnauthorized() {
        for (role in UserRole.entries.filter { it != UserRole.ADMIN }) {
            val user = AuthenticatedUser(id = UUID.randomUUID(), role = role)
            assertFailsWith(NotFound::class) { controller.getUser(user, customerUser.id) }
        }
    }

    @Test
    fun getUsersOk() {
        val users = controller.getUsers(adminUser).map { it.id }.toSet()
        assertEquals(setOf(adminUser.id, customerUser.id), users)
    }

    @Test
    fun getUsersUnauthorized() {
        for (role in UserRole.entries.filter { it != UserRole.ADMIN && it != UserRole.ORDERER }) {
            val user = AuthenticatedUser(id = UUID.randomUUID(), role = role)
            assertFailsWith(NotFound::class) { controller.getUsers(user) }
        }
    }

    @Test
    fun updateUserOk() {
        val oldPasswordHash = jdbi.inTransactionUnchecked { it.getUserPasswordHash(customerUser.id) }
        val email = "${UUID.randomUUID()}@example.com"
        val name = "${UUID.randomUUID()}"
        val updatedUser =
            controller.updateUser(
                adminUser,
                customerUser.id,
                User.Companion.UserInput(
                    email = email,
                    name = name,
                    role = UserRole.CUSTOMER,
                    active = false
                )
            )
        val updatedPasswordHash = jdbi.inTransactionUnchecked { it.getUserPasswordHash(customerUser.id) }

        assertNotEquals(updatedPasswordHash, oldPasswordHash)
        assertFalse(updatedUser.active)
        assertEquals(email, updatedUser.email)
        assertEquals(name, updatedUser.name)
    }

    @Test
    fun updateUserUnauthorized() {
        for (role in UserRole.entries.filter { it != UserRole.ADMIN }) {
            val user = AuthenticatedUser(id = UUID.randomUUID(), role = role)
            assertFailsWith(NotFound::class) {
                controller.updateUser(
                    user,
                    customerUser.id,
                    User.Companion.UserInput(
                        email = "new@example.com",
                        name = "New Name",
                        role = UserRole.CUSTOMER,
                        active = false
                    )
                )
            }
        }
    }

    @Test
    fun updatePasswordOk() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val currentPassword = "password.1A"
        val currentHash = encoder.encode(currentPassword)
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET password_hash = :password WHERE id = :id")
                .bind("password", currentHash)
                .bind("id", customerUser.id)
                .execute()
        }

        val newPassword = "passwordlong.2A"

        controller.updateUserPassword(
            customerUser,
            User.Companion.UpdatePasswordPayload(currentPassword, newPassword)
        )

        val updatedHash = jdbi.inTransactionUnchecked { it.getUserPasswordHash(customerUser.id) }
        val matches = encoder.matches(newPassword, updatedHash)
        assertTrue(matches)

        val user = controller.getUser(systemUser, customerUser.id)
        assertTrue(user.passwordUpdated!!)
    }

    @Test
    fun updatePasswordTooWeak() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val currentPassword = "password.1A"
        val currentHash = encoder.encode(currentPassword)
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET password_hash = :password WHERE id = :id")
                .bind("password", currentHash)
                .bind("id", customerUser.id)
                .execute()
        }

        val newPassword = "password.2A"

        assertFailsWith(BadRequest::class) {
            controller.updateUserPassword(
                customerUser,
                User.Companion.UpdatePasswordPayload(currentPassword, newPassword)
            )
        }
    }

    @Test
    fun updatePasswordWrongCurrentPassword() {
        val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
        val jdbi = controller.jdbi
        val currentPassword = "password.1A"
        val currentHash = encoder.encode(currentPassword)
        jdbi.inTransactionUnchecked {
            it.createUpdate("UPDATE users SET password_hash = :password WHERE id = :id")
                .bind("password", currentHash)
                .bind("id", customerUser.id)
                .execute()
        }

        val newPassword = "passwordlong.2A"

        assertFailsWith(BadRequest::class) {
            controller.updateUserPassword(
                customerUser,
                User.Companion.UpdatePasswordPayload("password.1B", newPassword)
            )
        }

        assertFailsWith(BadRequest::class) {
            controller.updateUserPassword(
                customerUser,
                User.Companion.UpdatePasswordPayload(currentPassword, currentPassword)
            )
        }
    }

    @Test
    fun updatePasswordUnauthorized() {
        for (role in UserRole.entries.filter { it != UserRole.CUSTOMER }) {
            val user = AuthenticatedUser(id = UUID.randomUUID(), role = role)
            assertFailsWith(NotFound::class) {
                controller.updateUserPassword(
                    user,
                    User.Companion.UpdatePasswordPayload("password.1A", "password.2A")
                )
            }
        }
    }
}
