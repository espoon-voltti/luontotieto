// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.common

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.UserRole
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import java.time.LocalDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull
import kotlin.math.pow

data class AdUser(
    val externalId: String,
    val name: String,
    val email: String?
)

data class UserStatus(
    val delayUntil: LocalDateTime?,
    val isLocked: Boolean,
    val lockoutExpiration: LocalDateTime?
)

data class UserFailedAttempts(
    val failedAttempts: Int,
)

data class AppUser(
    val id: UUID,
    val name: String,
    val externalId: String?,
    val email: String?,
    val role: UserRole,
    val active: Boolean,
    val passwordUpdated: Boolean?
)

data class AppUserWithPassword(
    val id: UUID,
    val name: String,
    val email: String?,
    val password: String,
    val externalId: String?,
    val role: UserRole,
    val active: Boolean,
    val passwordUpdated: Boolean?
) {
    fun toAppUser(): AppUser =
        AppUser(
            id = this.id,
            externalId = this.externalId,
            name = this.name,
            email = this.email,
            role = this.role,
            active = this.active,
            passwordUpdated = this.passwordUpdated
        )
}

fun Handle.upsertAppUserFromAd(
    adUser: AdUser,
    user: AuthenticatedUser,
): AppUser =
    createQuery(
        // language=SQL
        """
        INSERT INTO users (external_id, name, email, created_by, updated_by)
        VALUES (:externalId, :name, :email, :createdBy, :updatedBy)
        ON CONFLICT (external_id) DO UPDATE
        SET updated = now(), name = :name, updated_by = :updatedBy
        RETURNING id, external_id, name, email, role, active
        """.trimIndent()
    ).bindKotlin(adUser)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .mapTo<AppUser>()
        .one()

fun Handle.getAppUser(id: UUID) =
    createQuery(
        // language=SQL
        """
        SELECT id, external_id, name, email, role, active, password_updated as "passwordUpdated"
        FROM users 
        WHERE id = :id AND NOT system_user
        """.trimIndent()
    ).bind("id", id)
        .mapTo<AppUser>()
        .findOne()
        .getOrNull()

fun Handle.getAppUserWithPassword(email: String) =
    createQuery(
        // language=SQL
        """
        SELECT id, external_id, name, email, password_hash AS password, role, 
        active, password_updated as "passwordUpdated"
        FROM users 
        WHERE email = :email AND NOT system_user AND password_hash IS NOT NULL
        """.trimIndent()
    ).bind("email", email)
        .mapTo<AppUserWithPassword>()
        .findOne()
        .getOrNull()

fun Handle.userIsLockedOrInDelayPeriod(email: String): String? {
    val userStatus =
        createQuery(
            """
                SELECT delay_until, is_locked, lockout_expiration 
                FROM users 
                WHERE email = :email
                """
        ).bind("email", email)
            .mapTo<UserStatus>()
            .findOne()
            .getOrNull()

    if (userStatus != null) {
        if (userStatus.isLocked && LocalDateTime.now().isBefore(userStatus.lockoutExpiration)) {
            return "account-is-locked"
        } else if (userStatus.delayUntil != null && LocalDateTime.now().isBefore(userStatus.delayUntil)) {
            return "account-login-delay"
        }
    }

    return null
}

/**
 * Record a failed login attempt and set progressive delay or lock account if necessary
 * Example workflow logic
 * First 2 failed attempts: No delay.
 * 3rd failed attempt: 5 seconds delay.
 * 4th failed attempt: 10 seconds delay.
 * 5th failed attempt: 20 seconds delay, and a 5 minutes lockout if the threshold is reached.
 */
fun Handle.loginFailed(email: String) {
    //  1. Fetch the current number of failed attempts from the database
    val currentFailedAttempts =
        createQuery(
            """
                SELECT failed_attempts 
                FROM users 
                WHERE email = :email
                """
        ).bind("email", email)
            .mapTo<UserFailedAttempts>()
            .one()

    val baseDelay = 5
    // 2. Calculate the exponential delay
    // - If the number of failedAttempts is less than 2, the delay is the base delay
    // - If the number of failed attempts is greater than or equal to 2, the delay increases exponentially
    val delayTime = baseDelay * 2.0.pow(maxOf(0, currentFailedAttempts.failedAttempts - 2).toDouble()).toInt()

    // 3. Update the user's failed attempts, delay_until, and lock the account if necessary
    createUpdate(
        """
     UPDATE users 
        SET 
            failed_attempts = failed_attempts + 1,
            last_failed_attempt = NOW(),
            delay_until = CASE 
                WHEN failed_attempts >= 2 THEN NOW() + INTERVAL '1 second' * :delayTime
                ELSE delay_until 
            END,
            is_locked = CASE 
                WHEN failed_attempts + 1 >= 5 THEN TRUE 
                ELSE is_locked 
            END,
            lockout_expiration = CASE 
                WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '5 minutes'
                ELSE lockout_expiration 
            END
        WHERE email = :email
    """
    ).bind("email", email)
        .bind("delayTime", delayTime)
        .execute()
}

fun Handle.loginSuccess(email: String) =
    createUpdate(
        """
            UPDATE users SET 
            failed_attempts = 0, 
            is_locked = FALSE, 
            delay_until = NULL, 
            lockout_expiration = NULL
            WHERE email = :email
            """
    ).bind("email", email)
        .execute()
