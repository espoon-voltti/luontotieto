// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import org.apache.http.client.utils.URIBuilder
import org.springframework.core.env.Environment
import java.util.UUID

data class LuontotietoHost(val host: String) {
    fun getReportUrl(id: UUID): String {
        val builder = URIBuilder(host)
        builder.path = "/luontotieto/selvitys/$id"
        return builder.build().toString()
    }

    fun getCustomerUserLoginUrl(): String {
        val builder = URIBuilder(host)
        builder.path = "/kirjaudu/yrityskayttaja"
        return builder.build().toString()
    }

    companion object {
        fun fromEnvironment(env: Environment): LuontotietoHost {
            return LuontotietoHost(env.lookup("luontotieto.host"))
        }
    }
}
