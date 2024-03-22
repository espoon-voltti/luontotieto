// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.fasterxml.jackson.databind.json.JsonMapper
import com.zaxxer.hikari.HikariDataSource
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.jdbi.v3.core.mapper.ColumnMappers
import org.jdbi.v3.jackson2.Jackson2Config
import org.jdbi.v3.jackson2.Jackson2Plugin
import org.jdbi.v3.postgres.PostgresPlugin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class DbConfig {
    @Bean
    fun jdbi(
        dataSource: HikariDataSource,
        jsonMapper: JsonMapper
    ) = configureJdbi(Jdbi.create(dataSource), jsonMapper)
}

private fun configureJdbi(
    jdbi: Jdbi,
    jsonMapper: JsonMapper
): Jdbi {
    jdbi
        .installPlugin(KotlinPlugin())
        .installPlugin(PostgresPlugin())
        .installPlugin(Jackson2Plugin())
    jdbi.getConfig(ColumnMappers::class.java).coalesceNullPrimitivesToDefaults = false
    jdbi.getConfig(Jackson2Config::class.java).mapper = jsonMapper
    return jdbi
}
