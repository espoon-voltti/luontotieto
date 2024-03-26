// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class StudentInput(
    val firstName: String,
    val lastName: String,
)

fun Handle.insertStudent(
    data: StudentInput,
    user: AuthenticatedUser
): UUID {
    return createUpdate(
        """
INSERT INTO students (first_name, last_nameo) 
VALUES (:firstName, :lastName)
RETURNING id
"""
    )
        .bindKotlin(data)
        .bind("user", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<UUID>()
        .one()
}

data class Student(
    val id: UUID,
    val firstName: String,
    val lastName: String,
)

fun Handle.getStudent(id: UUID) =
    createQuery(
"""
SELECT id, first_name, last_name
FROM students
WHERE id = :id
"""
    )
        .bind("id", id)
        .mapTo<Student>()
        .findOne()
        .getOrNull()
        ?: throw NotFound()
