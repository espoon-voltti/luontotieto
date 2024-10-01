// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.domain

import fi.espoo.luontotieto.config.AuditEvent
import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.config.GeoserverEnv
import fi.espoo.luontotieto.config.audit
import mu.KotlinLogging
import okhttp3.Credentials
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/geoserver")
class GeoserverController {
    data class GeoServerReponseStatus(val isSuccess: Boolean)

    @Autowired
    lateinit var env: GeoserverEnv

    private val logger = KotlinLogging.logger {}

    @GetMapping("/reload-configuration")
    fun reloadSchemas(user: AuthenticatedUser): GeoServerReponseStatus {
        user.checkRoles(UserRole.ADMIN)
        logger.audit(user, AuditEvent.RELOAD_GEOSEVER_CONFIGURATION, mapOf("id" to "${user.id}"))

        val client = OkHttpClient()

        // Create Basic Auth credentials
        val credentials = Credentials.basic(env.userName, env.password)

        val request =
            Request.Builder()
                .url("${env.baseUrl}/rest/reload")
                .header("Authorization", credentials)
                .post(okhttp3.RequestBody.create("application/xml".toMediaType(), ""))
                .build()

        // Execute the request
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                logger.error("Failed to reload GeoServer: $response")
            }
            return GeoServerReponseStatus(response.isSuccessful)
        }
    }
}
