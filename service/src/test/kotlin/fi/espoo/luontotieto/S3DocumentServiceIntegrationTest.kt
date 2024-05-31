// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.BucketEnv
import fi.espoo.luontotieto.s3.DocumentService
import fi.espoo.luontotieto.s3.MultipartDocument
import fi.espoo.luontotieto.s3.S3DocumentService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class S3DocumentServiceIntegrationTest : FullApplicationTest() {
    @Autowired private lateinit var s3Client: S3Client

    @Autowired private lateinit var s3Presigner: S3Presigner

    @Autowired private lateinit var bucketEnv: BucketEnv

    private lateinit var documentClient: DocumentService

    @BeforeEach
    override fun beforeEach() {
        documentClient =
            S3DocumentService(s3Client, s3Presigner, bucketEnv.copy(proxyThroughNginx = true))
    }

    @Test
    fun `redirects when not proxying through nginx`() {
        val documentClientNoProxy =
            S3DocumentService(s3Client, s3Presigner, bucketEnv.copy(proxyThroughNginx = false))
        documentClientNoProxy.upload(
            bucketEnv.data,
            MultipartDocument(
                name = "test",
                file = MockMultipartFile("test", byteArrayOf(0x11, 0x22, 0x33)),
                contentType = "text/plain"
            )
        )

        val response = documentClientNoProxy.responseAttachment(bucketEnv.data, "test", null)
        assertEquals(HttpStatus.FOUND, response.statusCode)
        assertNotNull(response.headers["Location"])
        assertNull(response.headers["X-Accel-Redirect"])
    }

    @Test
    fun `uses X-Accel-Redirect when proxying through nginx`() {
        documentClient.upload(
            bucketEnv.data,
            MultipartDocument(
                name = "test",
                file = MockMultipartFile("test", byteArrayOf(0x33, 0x22, 0x11)),
                contentType = "text/plain"
            )
        )

        val response = documentClient.responseAttachment(bucketEnv.data, "test", null)
        assertEquals(HttpStatus.OK, response.statusCode)
        assertNull(response.headers["Location"])
        assertNotNull(response.headers["X-Accel-Redirect"])
    }

    @Test
    fun `upload-download round trip with get`() {
        documentClient.upload(
            bucketEnv.data,
            MultipartDocument(
                name = "test",
                file = MockMultipartFile("test", byteArrayOf(0x11, 0x33, 0x22)),
                contentType = "text/plain"
            )
        )

        val document = documentClient.get(bucketEnv.data, "test")

        assertContentEquals(byteArrayOf(0x11, 0x33, 0x22), document.bytes)
    }
}
