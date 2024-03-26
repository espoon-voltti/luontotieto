// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.auth0.jwt.exceptions.JWTVerificationException
import com.auth0.jwt.interfaces.DecodedJWT
import com.auth0.jwt.interfaces.JWTVerifier
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpFilter
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import mu.KotlinLogging
import java.util.UUID

data class AuthenticatedUser(
    val id: UUID
) {
    fun isSystemUser() = id == UUID.fromString("00000000-0000-0000-0000-000000000000")
}

class JwtToAuthenticatedUser : HttpFilter() {
    override fun doFilter(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        val user =
            request.getDecodedJwt()?.subject?.let { subject ->
                AuthenticatedUser(id = UUID.fromString(subject))
            }
        if (user != null) {
            request.setAttribute(ATTR_USER, user)
        }
        chain.doFilter(request, response)
    }
}

class HttpAccessControl : HttpFilter() {
    override fun doFilter(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        if (request.requiresAuthentication()) {
            val authenticatedUser = request.getAuthenticatedUser()
            if (authenticatedUser == null) {
                return response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "fi.espoo.luontotieto.common.Unauthorized")
            }
            if (!request.isAuthorized(authenticatedUser)) {
                return response.sendError(HttpServletResponse.SC_FORBIDDEN, "fi.espoo.luontotieto.common.Forbidden")
            }
        }

        chain.doFilter(request, response)
    }

    private fun HttpServletRequest.requiresAuthentication(): Boolean =
        when {
            requestURI == "/health" || requestURI == "/actuator/health" -> false
            else -> true
        }

    private fun HttpServletRequest.isAuthorized(user: AuthenticatedUser): Boolean =
        when {
            requestURI.startsWith("/system/") -> user.isSystemUser()
            else -> !user.isSystemUser()
        }
}

class JwtTokenDecoder(private val jwtVerifier: JWTVerifier) : HttpFilter() {
    private val logger = KotlinLogging.logger {}

    override fun doFilter(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        try {
            request.getBearerToken()
                ?.takeIf { it.isNotEmpty() }
                ?.let { request.setDecodedJwt(jwtVerifier.verify(it)) }
        } catch (e: JWTVerificationException) {
            logger.error(e) { "JWT token verification failed" }
        }
        chain.doFilter(request, response)
    }
}

fun HttpServletRequest.getAuthenticatedUser(): AuthenticatedUser? = getAttribute(ATTR_USER) as AuthenticatedUser?

private const val ATTR_USER = "luontotieto.user"
private const val ATTR_JWT = "luontotieto.jwt"

private fun HttpServletRequest.getDecodedJwt(): DecodedJWT? = getAttribute(ATTR_JWT) as DecodedJWT?

private fun HttpServletRequest.setDecodedJwt(jwt: DecodedJWT) = setAttribute(ATTR_JWT, jwt)

private fun HttpServletRequest.getBearerToken(): String? = getHeader("Authorization")?.substringAfter("Bearer ", missingDelimiterValue = "")
