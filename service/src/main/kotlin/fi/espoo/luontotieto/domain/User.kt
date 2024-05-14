// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.DatabaseEnum
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.enums.DatabaseValue
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

enum class UserRole : DatabaseEnum {
    @DatabaseValue("pääkäyttäjä")
    ADMIN,

    @DatabaseValue("tilaaja")
    ORDERER,

    @DatabaseValue("katselija")
    VIEWER,

    @DatabaseValue("yrityskäyttäjä")
    CUSTOMER;

    override val sqlType = "users_role"
}

data class User(
    val id: UUID,
    val name: String,
    val role: UserRole,
    val created: OffsetDateTime,
    val updated: OffsetDateTime,
    val active: Boolean,
    val email: String?,
    val externalId: String?,
    val createdBy: String?,
    val updatedBy: String?,
) {
    companion object {
        data class UserInput(
            val email: String,
            val name: String,
            val role: UserRole,
            val active: Boolean
        )

        data class CreateCustomerUser(
            val email: String,
            val name: String,
        )
    }
}

private const val SELECT_USER_SQL =
    """
    SELECT u.id                                       AS "id",
           u.email                                    AS "email",
           u.name                                     AS "name",
           u.role                                     AS "role",
           u.created                                  AS "created",
           u.updated                                  AS "updated",
           u.active                                   AS "active",
           u.external_id                              AS "externalId",
           uc.name                                    AS "createdBy",
           uu.name                                    AS "updatedBy"
    FROM users u
        LEFT JOIN users uc ON u.created_by = uc.id
        LEFT JOIN users uu ON u.updated_by = uu.id

"""

fun Handle.insertUser(
    data: User.Companion.CreateCustomerUser,
    user: AuthenticatedUser,
    passwordHash: String
): User {
    return createQuery(
        """
            WITH users AS (
                INSERT INTO users (email, name, role, password_hash, created_by, updated_by) 
                VALUES (:email, :name, :role, :passwordHash, :createdBy, :updatedBy)
                RETURNING *
                ) 
            $SELECT_USER_SQL
            """
    )
        .bindKotlin(data)
        .bind("role", UserRole.CUSTOMER)
        .bind("passwordHash", passwordHash)
        .bind("createdBy", user.id)
        .bind("updatedBy", user.id)
        .mapTo<User>()
        .one()
}

fun Handle.putUser(
    id: UUID,
    data: User.Companion.UserInput,
    user: AuthenticatedUser
): User {
    return createQuery(
        """
             WITH users AS (
                UPDATE users 
                 SET email = :email, name = :name, role = :role, 
                 active = :active,  updated_by = :updatedBy
                 WHERE id = :id AND NOT system_user
                 RETURNING *
               ) 
             $SELECT_USER_SQL
            """
    )
        .bindKotlin(data)
        .bind("id", id)
        .bind("updatedBy", user.id)
        .mapTo<User>()
        .findOne()
        .getOrNull()
        ?: throw NotFound()
}

fun Handle.getUser(
    id: UUID,
    user: AuthenticatedUser
) = createQuery(
    """
                $SELECT_USER_SQL
                WHERE u.id = :id AND NOT u.system_user
            """
)
    .bind("id", id)
    .bind("userId", user.id)
    .mapTo<User>()
    .findOne()
    .getOrNull()
    ?: throw NotFound()

fun Handle.getUsers() =
    createQuery(
        """
                $SELECT_USER_SQL
                WHERE NOT u.system_user
            """
    )
        .mapTo<User>()
        .list()
        ?: emptyList()
