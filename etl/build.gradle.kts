// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

plugins {
    id("org.flywaydb.flyway") version "10.10.0"
}

repositories {
    mavenCentral()
}

buildscript {
    dependencies {
        classpath("org.postgresql:postgresql:42.7.1")
        classpath("org.flywaydb:flyway-database-postgresql:10.4.1")
    }
}

flyway {
    url = System.getenv("POSTGRES_URL") ?: "jdbc:postgresql://localhost:5433/paikkatietodb"
    user = System.getenv("POSTGRES_USER") ?: "paikkatietodb"
    password = System.getenv("POSTGRES_PASSWORD") ?: "postgres"
    cleanDisabled = false
    locations = arrayOf("filesystem:./db/migration/*.sql")
}
