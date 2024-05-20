// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.common

import org.jdbi.v3.core.statement.UnableToExecuteStatementException

fun UnableToExecuteStatementException.isUniqueConstraintViolation() = message?.contains("violates unique constraint") == true

data class BadRequest(
    override val message: String,
    val errorCode: String? = null,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

data class NotFound(
    override val message: String = "Not found",
    val errorCode: String? = null,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

data class Conflict(
    override val message: String,
    val errorCode: String? = null,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

data class Forbidden(
    override val message: String = "Permission denied",
    val errorCode: String? = null,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

data class Unauthorized(
    override val message: String = "Unauthorized",
    val errorCode: String? = null,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)
