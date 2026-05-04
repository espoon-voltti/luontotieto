// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import java.net.URI
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppEnv(val jwt: JwtEnv) {
    data class JwtEnv(val publicKeysUrl: URI)
}
