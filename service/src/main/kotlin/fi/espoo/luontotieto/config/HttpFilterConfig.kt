// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.auth0.jwt.interfaces.JWTVerifier
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class HttpFilterConfig {
    @Bean
    fun jwtTokenParser(jwtVerifier: JWTVerifier) =
        FilterRegistrationBean(JwtTokenDecoder(jwtVerifier)).apply {
            setName("jwtTokenParser")
            urlPatterns = listOf("/*")
            order = -10
        }

    @Bean
    fun jwtToAuthenticatedUser() =
        FilterRegistrationBean(JwtToAuthenticatedUser()).apply {
            setName("jwtToAuthenticatedUser")
            urlPatterns = listOf("/*")
            order = -9
        }

    @Bean
    fun httpAccessControl() =
        FilterRegistrationBean(HttpAccessControl()).apply {
            setName("httpAccessControl")
            urlPatterns = listOf("/*")
            order = -8
        }
}
