// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import com.zaxxer.hikari.HikariDataSource
import jakarta.annotation.PostConstruct
import org.flywaydb.core.Flyway
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Configuration

@Configuration
class FlywayConfig {
    @Qualifier("paikkatieto-datasource")
    @Autowired
    private val dataSource: HikariDataSource? = null

    @PostConstruct
    fun migrateFlyway() {
        val dataSource = dataSource ?: return
        val config = Flyway.configure().dataSource(dataSource).locations("db/paikkatieto/migration")

        val flyway = Flyway(config)
        flyway.migrate()
    }
}
