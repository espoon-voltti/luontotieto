// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import fi.espoo.luontotieto.common.BadRequest
import fi.espoo.luontotieto.common.Conflict
import fi.espoo.luontotieto.common.Forbidden
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.common.Unauthorized
import fi.espoo.luontotieto.common.isUniqueConstraintViolation
import jakarta.servlet.http.HttpServletRequest
import org.jdbi.v3.core.statement.UnableToExecuteStatementException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import java.io.IOException
import java.time.Instant

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
class ExceptionHandler : ResponseEntityExceptionHandler() {
    @ExceptionHandler(value = [BadRequest::class])
    fun badRequest(
        req: HttpServletRequest,
        ex: BadRequest
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Bad request (${ex.message})", ex)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(errorCode = ex.errorCode, errorMessages = ex.errorMessages))
    }

    @ExceptionHandler(value = [NotFound::class])
    fun notFound(
        req: HttpServletRequest,
        ex: NotFound
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Not found (${ex.message})", ex)
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(errorCode = ex.errorCode))
    }

    @ExceptionHandler(value = [Conflict::class])
    fun conflict(
        req: HttpServletRequest,
        ex: Conflict
    ): ResponseEntity<ErrorResponse> {
        logger.warn("fi.espoo.luontotieto.common.Conflict (${ex.message})", ex)
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ErrorResponse(errorCode = ex.errorCode))
    }

    @ExceptionHandler(value = [Unauthorized::class])
    fun unauthorized(
        req: HttpServletRequest,
        ex: Unauthorized
    ): ResponseEntity<ErrorResponse> {
        logger.warn("fi.espoo.luontotieto.common.Unauthorized (${ex.message})", ex)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(errorCode = ex.errorCode))
    }

    @ExceptionHandler(value = [Forbidden::class])
    fun forbidden(
        req: HttpServletRequest,
        ex: Forbidden
    ): ResponseEntity<ErrorResponse> {
        logger.warn("fi.espoo.luontotieto.common.Forbidden (${ex.message})", ex)
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse(errorCode = ex.errorCode))
    }

    @ExceptionHandler(value = [UnableToExecuteStatementException::class])
    fun unableToExecuteStatementException(
        req: HttpServletRequest,
        ex: UnableToExecuteStatementException
    ): ResponseEntity<ErrorResponse> {
        if (ex.isUniqueConstraintViolation()) {
            logger.warn("Unique constraint violation (${ex.message})", ex)
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse("UniqueConstraintViolation"))
        }
        return unexpectedError(req, ex)
    }

    // We don't want alerts from ClientAbortExceptions or return any http responses to them
    @ExceptionHandler(value = [IOException::class])
    fun ioExceptions(
        req: HttpServletRequest,
        ex: IOException
    ): ResponseEntity<ErrorResponse>? {
        if (ex.toString().contains("ClientAbortException", true)) {
            logger.warn("ClientAbortException", ex)
            return null
        }
        logger.error("IOException", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErrorResponse())
    }

    override fun handleExceptionInternal(
        ex: Exception,
        body: Any?,
        headers: HttpHeaders,
        statusCode: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any>? {
        logger.warn("Spring exception (${ex.message})", ex)
        return super.handleExceptionInternal(ex, body, headers, statusCode, request)
    }

    @ExceptionHandler(value = [Throwable::class])
    fun unexpectedError(
        req: HttpServletRequest,
        ex: Throwable
    ): ResponseEntity<ErrorResponse> {
        val message = "Unexpected error (${ex.message})"
        logger.error(message, ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErrorResponse())
    }
}

data class ErrorResponse(
    val errorCode: String? = null,
    val errorMessages: List<String>? = null,
    val timestamp: Long = Instant.now().toEpochMilli()
)
