// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.s3

import com.github.kittinunf.fuel.core.Response
import fi.espoo.luontotieto.common.NotFound
import fi.espoo.luontotieto.config.BucketEnv
import mu.KotlinLogging
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import software.amazon.awssdk.services.s3.model.GetObjectTaggingRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.model.S3Exception
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.URL
import java.time.Duration
import javax.imageio.ImageIO

private const val INTERNAL_REDIRECT_PREFIX = "/internal_redirect/"
private val logger = KotlinLogging.logger {}

@Service
class S3DocumentService(
    private val s3Client: S3Client,
    private val s3Presigner: S3Presigner,
    private val env: BucketEnv
) : DocumentService {
    fun checkFileIsClean(
        bucketName: String,
        keyName: String,
    ) {
        logger.info { "Check file $keyName has av tag" }
        try {
            val objectTaggingRequest =
                GetObjectTaggingRequest.builder().bucket(bucketName).key(keyName).build()

            val tags = s3Client.getObjectTagging(objectTaggingRequest)

            logger.info { "Found $tags for the file" }

            val hasTag = tags.tagSet().any { tag -> tag.key() == "av-status" && tag.value() == "CLEAN" }

            if (!hasTag) {
                logger.warn { "No clean tag found for the file" }
                throw NotFound("Access denied", "access-denied")
            }
        } catch (e: NoSuchKeyException) {
            logger.error("checkIfFileExists: File not found NoSuchKeyException", e)
            throw NotFound()
        } catch (e: S3Exception) {
            logger.error("checkIfFileExists: S3Exception", e)
            // If the file is still undergoing antivirus scan this will be the returned code
            if (e.statusCode() == 403 && e.awsErrorDetails().errorCode() == "AccessDenied") {
                // Handle AccessDenied error
                throw NotFound("Access denied", "access-denied")
            }
        } catch (e: Exception) {
            logger.error("checkIfFileExists Error", e)
            throw e
        }
    }

    override fun get(
        bucketName: String,
        key: String
    ): Document {
        if (env.verifyFileAvTagged) {
            checkFileIsClean(bucketName, key)
        }
        val request = GetObjectRequest.builder().bucket(bucketName).key(key).build()
        val stream = s3Client.getObject(request) ?: throw NotFound("File not found")
        return stream.use {
            Document(
                name = key,
                bytes = it.readAllBytes(),
                contentType = it.response().contentType()
            )
        }
    }

    fun download(
        bucketName: String,
        key: String
    ): ResponseInputStream<GetObjectResponse> {
        val request = GetObjectRequest.builder().bucket(bucketName).key(key).build()
        return s3Client.getObject(request) ?: throw NotFound("File not found")
    }

    fun presignedGetUrl(
        bucketName: String,
        key: String,
        contentDisposition: ContentDisposition
    ): URL {
        if (env.verifyFileAvTagged) {
            checkFileIsClean(bucketName, key)
        }
        val request =
            GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .responseContentDisposition(contentDisposition.toString())
                .build()

        val getObjectPresignRequest =
            GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(1))
                .getObjectRequest(request)
                .build()

        return s3Presigner.presignGetObject(getObjectPresignRequest).url()
    }

    override fun response(
        bucketName: String,
        key: String,
        contentDisposition: ContentDisposition
    ): ResponseEntity<Any> {
        val presignedUrl = presignedGetUrl(bucketName, key, contentDisposition)

        return if (env.proxyThroughNginx) {
            val url = "$INTERNAL_REDIRECT_PREFIX$presignedUrl"
            ResponseEntity.ok()
                .header("X-Accel-Redirect", url)
                .header("Content-Disposition", contentDisposition.toString())
                .body(null)
        } else {
            // nginx is not available in development => redirect to the presigned S3 url
            ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", presignedUrl.toString())
                .header("Content-Disposition", contentDisposition.toString())
                .body(null)
        }
    }

    override fun upload(
        bucketName: String,
        document: MultipartDocument
    ): DocumentLocation {
        val key = document.name
        val request =
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(document.contentType)
                .build()

        val cleaned = removeExifDataIfImage(document.file)

        val body = RequestBody.fromInputStream(cleaned.first, cleaned.second)

        logger.info("Upload file to S3. bucketName=$bucketName key=$key")

        s3Client.putObject(request, body)

        return DocumentLocation(bucket = bucketName, key = key)
    }

    override fun delete(
        bucketName: String,
        key: String
    ) {
        val request = DeleteObjectRequest.builder().bucket(bucketName).key(key).build()
        s3Client.deleteObject(request)
    }
}


fun removeExifDataIfImage(file: MultipartFile): Pair<InputStream, Long> {
    val contentType = file.contentType
    if (contentType == null || !contentType.startsWith("image/")) {
        return Pair(file.inputStream, file.size)
    }

    val originalFormat = getImageFormat(file) ?: throw IllegalArgumentException("Unsupported image format")

    // Open the image and process it
    val image: BufferedImage = ImageIO.read(file.inputStream)
        ?: throw IllegalArgumentException("Invalid image file")

    // Create a new BufferedImage to effectively strip EXIF metadata
    val newImage = BufferedImage(image.width, image.height, image.type)
    val graphics = newImage.createGraphics()
    graphics.drawImage(image, 0, 0, null)
    graphics.dispose()

    // Convert the new image to a byte array
    val outputStream = ByteArrayOutputStream()

    ImageIO.write(newImage, originalFormat, outputStream)

    val modifiedSize = outputStream.size().toLong()

    return Pair(ByteArrayInputStream(outputStream.toByteArray()), modifiedSize)
}

private fun getImageFormat(document: MultipartFile): String? {
    // Use ImageIO to determine the format name (e.g., "jpeg", "png", etc.)
    val inputStream = document.inputStream
    val imageReaders = ImageIO.getImageReaders(ImageIO.createImageInputStream(inputStream))

    return if (imageReaders.hasNext()) {
        val reader = imageReaders.next()
        val formatName = reader.formatName.lowercase()
        reader.dispose()
        formatName
    } else {
        null
    }
}

fun fuelResponseToS3URL(response: Response): String {
    return response.headers["X-Accel-Redirect"].first().replace(INTERNAL_REDIRECT_PREFIX, "")
}

fun responseEntityToS3URL(response: ResponseEntity<Any>): String {
    return response.headers["X-Accel-Redirect"]!!.first().replace(INTERNAL_REDIRECT_PREFIX, "")
}
