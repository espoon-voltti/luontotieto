// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.fasterxml.jackson.databind.json.JsonMapper
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.jdbi.v3.core.mapper.ColumnMappers
import org.jdbi.v3.jackson2.Jackson2Config
import org.jdbi.v3.jackson2.Jackson2Plugin
import org.jdbi.v3.postgres.PostgresPlugin
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

@Qualifier("luontotieto")
annotation class LuontotietoDataSource

@Qualifier("paikkatieto")
annotation class PaikkatietoDataSource

@Configuration
class DbConfig {
    @Bean
    @LuontotietoDataSource
    @ConfigurationProperties(prefix = "spring.datasource.luontotieto")
    fun luontotietoHikariConfig() = HikariConfig()

    @Bean
    @LuontotietoDataSource
    @Primary
    fun luontotietoDataSource(
        @LuontotietoDataSource hikariConf: HikariConfig
    ) = HikariDataSource(hikariConf)

    @Bean("jdbi-luontotieto")
    fun jdbiLuontotieto(
        @LuontotietoDataSource
        dataSource: HikariDataSource,
        jsonMapper: JsonMapper
    ) = configureJdbi(Jdbi.create(dataSource), jsonMapper)

    @Bean
    @PaikkatietoDataSource
    @ConfigurationProperties(prefix = "spring.datasource.paikkatieto")
    fun paikkatietoHikariConfig() = HikariConfig()

    @Bean("paikkatieto-datasource")
    @PaikkatietoDataSource
    fun paikkatietoDataSource(
        @PaikkatietoDataSource hikariConf: HikariConfig
    ) = HikariDataSource(hikariConf)

    @Bean("jdbi-paikkatieto")
    fun jdbiPaikkatieto(
        @PaikkatietoDataSource
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
