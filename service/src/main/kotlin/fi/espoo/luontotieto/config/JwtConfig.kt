// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import AppEnv
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.JWTVerifier
import com.auth0.jwt.interfaces.RSAKeyProvider
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.core.Base64Variants
import com.fasterxml.jackson.module.kotlin.jacksonMapperBuilder
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.InputStream
import java.math.BigInteger
import java.security.KeyFactory
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.RSAPublicKeySpec

@Configuration
class JwtConfig {
    @Bean
    fun rsaJwtAlgorithm(env: AppEnv): Algorithm {
        val publicKeys = env.jwt.publicKeysUrl.toURL().openStream().use { loadPublicKeys(it) }
        return Algorithm.RSA256(JwtKeys(publicKeys))
    }

    @Bean
    fun jwtVerifier(algorithm: Algorithm): JWTVerifier = JWT.require(algorithm).acceptLeeway(1).build()
}

class JwtKeys(private val publicKeys: Map<String, RSAPublicKey>) : RSAKeyProvider {
    override fun getPrivateKeyId(): String? = null

    override fun getPrivateKey(): RSAPrivateKey? = null

    override fun getPublicKeyById(keyId: String): RSAPublicKey? = publicKeys[keyId]
}

fun loadPublicKeys(inputStream: InputStream): Map<String, RSAPublicKey> {
    @JsonIgnoreProperties(ignoreUnknown = true)
    class Jwk(val kid: String, val n: ByteArray, val e: ByteArray)

    class JwkSet(val keys: List<Jwk>)

    val kf = KeyFactory.getInstance("RSA")
    return jacksonMapperBuilder()
        .defaultBase64Variant(Base64Variants.MODIFIED_FOR_URL)
        .build()
        .readValue<JwkSet>(inputStream).keys.associate {
            it.kid to
                kf.generatePublic(
                    RSAPublicKeySpec(
                        BigInteger(1, it.n),
                        BigInteger(1, it.e)
                    )
                ) as RSAPublicKey
        }
}
