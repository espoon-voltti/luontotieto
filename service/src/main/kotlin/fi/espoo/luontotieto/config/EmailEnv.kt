// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import org.springframework.core.env.Environment
import software.amazon.awssdk.regions.Region

data class EmailEnv(
    val enabled: Boolean,
    val region: Region,
    val senderAddress: String,
) {
    companion object {
        fun fromEnvironment(env: Environment) =
            EmailEnv(
                enabled =
                    env.lookup(
                        "luontotieto.email.enabled",
                    ),
                region =
                    env.lookup(
                        "luontotieto.email.region",
                    ),
                senderAddress =
                    env.lookup(
                        "luontotieto.email.sender_address",
                    )
            )
    }
}
