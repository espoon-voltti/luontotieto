// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.luontotieto.config

import mu.KotlinLogging
import org.springframework.core.env.Environment
import software.amazon.awssdk.regions.Region
import java.net.URI
import java.util.Locale

data class BucketEnv(
    val s3MockUrl: URI?,
    val proxyThroughNginx: Boolean,
    val data: String,
    val region: Region,
    val verifyFileAvTagged: Boolean
) {
    fun allBuckets() = listOf(data)

    companion object {
        fun fromEnvironment(env: Environment) =
            BucketEnv(
                s3MockUrl = env.lookup("luontotieto.s3mock.url"),
                proxyThroughNginx = env.lookup("luontotieto.bucket.proxy_through_nginx"),
                data = env.lookup("luontotieto.bucket.data"),
                region = Region.of(env.lookup("luontotieto.aws.region")),
                verifyFileAvTagged = env.lookup("luontotieto.bucket.verify_file_av_tagged")
            )
    }
}

inline fun <reified T> Environment.lookup(
    key: String,
    vararg deprecatedKeys: String
): T {
    val value = lookup(key, deprecatedKeys, T::class.java)
    if (value == null && null !is T) {
        error("Missing required configuration: $key (environment variable ${key.toSystemEnvKey()})")
    } else {
        return value as T
    }
}

fun <T> Environment.lookup(
    key: String,
    deprecatedKeys: Array<out String>,
    clazz: Class<out T>
): T? =
    deprecatedKeys
        .asSequence()
        .mapNotNull { legacyKey ->
            try {
                getProperty(legacyKey, clazz)?.also {
                    logger.warn {
                        "Using deprecated configuration key $legacyKey instead of $key (environment variable ${key.toSystemEnvKey()})"
                    }
                }
            } catch (e: Exception) {
                throw EnvLookupException(legacyKey, e)
            }
        }.firstOrNull()
        ?: try {
            getProperty(key, clazz)
        } catch (e: Exception) {
            throw EnvLookupException(key, e)
        }

private val logger = KotlinLogging.logger {}

class EnvLookupException(
    key: String,
    cause: Throwable
) : RuntimeException(
        "Failed to lookup configuration key $key (environment variable ${key.toSystemEnvKey()})",
        cause
    )

// Reference: Spring SystemEnvironmentPropertySource
fun String.toSystemEnvKey() = uppercase(Locale.ENGLISH).replace('.', '_').replace('-', '_')
