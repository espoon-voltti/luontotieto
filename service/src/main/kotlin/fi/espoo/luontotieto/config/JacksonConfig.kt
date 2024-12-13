// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.MapperFeature
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinFeature
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

fun defaultJsonMapperBuilder(): JsonMapper.Builder =
    JsonMapper
        .builder()
        .addModules(
            KotlinModule
                .Builder()
                .enable(KotlinFeature.SingletonSupport)
                .build(),
            JavaTimeModule(),
            Jdk8Module(),
            ParameterNamesModule()
        ).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

@Configuration
class JacksonConfig {
    // This replaces default JsonMapper provided by Spring Boot autoconfiguration
    @Bean
    fun jsonMapper(): JsonMapper =
        defaultJsonMapperBuilder()
            .disable(MapperFeature.DEFAULT_VIEW_INCLUSION)
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE)
            .build()
}
