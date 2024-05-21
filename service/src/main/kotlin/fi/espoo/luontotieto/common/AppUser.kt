// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.common

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.UserRole
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class AdUser(val externalId: String, val name: String, val email: String?)

data class AppUser(
    val id: UUID,
    val name: String,
    val externalId: String?,
    val email: String?,
    val role: UserRole,
    val active: Boolean
)

data class AppUserWithPassword(
    val id: UUID,
    val name: String,
    val email: String?,
    val password: String,
    val externalId: String?,
    val role: UserRole,
    val active: Boolean
) {
    fun toAppUser(): AppUser {
        return AppUser(
            id = this.id,
            externalId = this.externalId,
            name = this.name,
            email = this.email,
            role = this.role,
            active = this.active
        )
    }
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
        """
            .trimIndent()
    )
        .bindKotlin(adUser)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .mapTo<AppUser>()
        .one()

fun Handle.getAppUsers(): List<AppUser> =
    createQuery(
        """
    SELECT id, external_id, name, email, active
    FROM users
    WHERE NOT system_user
"""
    )
        .mapTo<AppUser>()
        .list()

fun Handle.getAppUser(id: UUID) =
    createQuery(
        // language=SQL
        """
        SELECT id, external_id, name, email, role, active
        FROM users 
        WHERE id = :id AND NOT system_user
        """
            .trimIndent()
    )
        .bind("id", id)
        .mapTo<AppUser>()
        .findOne()
        .getOrNull()

fun Handle.getAppUserWithPassword(email: String) =
    createQuery(
        // language=SQL
        """
        SELECT id, external_id, name, email, password_hash AS password, role, active
        FROM users 
        WHERE email = :email AND NOT system_user AND password_hash IS NOT NULL
        """
            .trimIndent()
    )
        .bind("email", email)
        .mapTo<AppUserWithPassword>()
        .findOne()
        .getOrNull()
