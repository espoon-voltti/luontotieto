// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import fi.espoo.luontotieto.common.DatabaseEnum
import fi.espoo.luontotieto.common.databaseValue
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.argument.Argument
import org.jdbi.v3.core.argument.ArgumentFactory
import org.jdbi.v3.core.generic.GenericTypes
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.jdbi.v3.core.mapper.ColumnMappers
import org.jdbi.v3.core.statement.StatementContext
import org.jdbi.v3.jackson2.Jackson2Config
import org.jdbi.v3.jackson2.Jackson2Plugin
import org.jdbi.v3.postgres.PostgresPlugin
import org.postgresql.util.PGobject
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import java.sql.PreparedStatement
import java.util.Optional
import java.util.function.Function

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

    @Bean("luontotieto-datasource")
    @LuontotietoDataSource
    @Primary
    fun luontotietoDataSource(
        @LuontotietoDataSource hikariConf: HikariConfig
    ) = HikariDataSource(hikariConf)

    @Bean("jdbi-luontotieto")
    fun jdbiLuontotieto(
        @LuontotietoDataSource dataSource: HikariDataSource,
        objectMapper: ObjectMapper
    ) = configureJdbi(Jdbi.create(dataSource), objectMapper)

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
        @PaikkatietoDataSource dataSource: HikariDataSource,
        objectMapper: ObjectMapper
    ) = configureJdbi(Jdbi.create(dataSource), objectMapper)
}

private fun configureJdbi(
    jdbi: Jdbi,
    objectMapper: ObjectMapper
): Jdbi {
    jdbi
        .installPlugin(KotlinPlugin())
        .installPlugin(PostgresPlugin())
        .installPlugin(Jackson2Plugin())
    jdbi.registerArgument(databaseEnumArgumentFactory)
    jdbi.getConfig(ColumnMappers::class.java).coalesceNullPrimitivesToDefaults = false
    jdbi.getConfig(Jackson2Config::class.java).mapper = objectMapper
    return jdbi
}

private class CustomObjectArgument(
    private val value: Any
) : Argument {
    override fun apply(
        position: Int,
        statement: PreparedStatement,
        ctx: StatementContext
    ) = statement.setObject(position, value)

    override fun toString(): String = value.toString()
}

private val databaseEnumArgumentFactory =
    ArgumentFactory.Preparable { type, _ ->
        val erasedType = GenericTypes.getErasedType(type)
        if (DatabaseEnum::class.java.isAssignableFrom(erasedType) && erasedType.isEnum) {
            val sqlType = (erasedType.enumConstants[0] as DatabaseEnum).sqlType
            Optional.of(
                Function { nullableValue ->
                    CustomObjectArgument(
                        PGobject().apply {
                            this.type = sqlType
                            if (nullableValue != null && nullableValue is DatabaseEnum) {
                                this.value = nullableValue.databaseValue()
                            }
                        }
                    )
                }
            )
        } else {
            Optional.empty()
        }
    }
