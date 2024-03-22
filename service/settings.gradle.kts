// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

rootProject.name = "luontotieto-service"

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven("https://build.shibboleth.net/maven/releases") {
            content {
                includeGroup("net.shibboleth")
                includeGroup("net.shibboleth.utilities")
                includeGroup("org.opensaml")
            }
        }
    }
}
