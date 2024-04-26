// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.s3
import fi.espoo.luontotieto.domain.BadRequest
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream

val tika: org.apache.tika.Tika = org.apache.tika.Tika()

fun checkFileContentType(file: InputStream): String {
    val detectedContentType = tika.detect(file)
    return detectedContentType
}

fun getAndCheckFileName(file: MultipartFile) =
    (file.originalFilename?.takeIf { it.isNotBlank() } ?: throw BadRequest("Filename missing"))
