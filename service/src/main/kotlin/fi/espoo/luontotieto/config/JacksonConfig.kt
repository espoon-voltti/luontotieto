// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.MapperFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

fun defaultJsonMapper(): ObjectMapper =
    ObjectMapper().apply {
        registerModules(
            KotlinModule
                .Builder()
                .enable(KotlinFeature.SingletonSupport)
                .enable(KotlinFeature.KotlinPropertyNameAsImplicitName)
                .build(),
            JavaTimeModule()
            // Note: Jdk8Module and ParameterNamesModule are no longer needed in Jackson 2.20+
        )
        disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    }

@Configuration
class JacksonConfig {
    // This replaces default ObjectMapper provided by Spring Boot autoconfiguration
    @Bean
    @Suppress("DEPRECATION") // disable() methods work fine, just deprecated in favor of builder
    fun objectMapper(): ObjectMapper =
        defaultJsonMapper().apply {
            disable(MapperFeature.DEFAULT_VIEW_INCLUSION)
            disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE)
        }
}
