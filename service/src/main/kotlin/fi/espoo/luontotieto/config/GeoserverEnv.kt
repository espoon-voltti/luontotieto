// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import org.springframework.core.env.Environment
import software.amazon.awssdk.regions.Region

data class GeoserverEnv(
    val baseUrl: String,
    val userName: String,
    val password: String,
) {
    companion object {
        fun fromEnvironment(env: Environment) =
            GeoserverEnv(
                baseUrl =
                    env.lookup(
                        "luontotieto.geoserver.baseurl",
                    ),
                userName =
                    env.lookup(
                        "luontotieto.geoserver.username",
                    ),
                password =
                    env.lookup(
                        "luontotieto.geoserver.password",
                    ),
            )
    }
}
