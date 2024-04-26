// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.databaseValue
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.ReportController
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class GpkgTemplateTest : FullApplicationTest() {
    @Autowired lateinit var controller: ReportController

    @Test
    fun `download template file`() {
        val documentTypes =
            DocumentType.entries.filter { it.databaseValue()?.startsWith("paikkatieto:") == true }
        for (documentType in documentTypes) {
            val response = controller.getGpkgTemplate(documentType)
            val file = response.body
            assertNotNull(file)
            assertTrue(file.contentAsByteArray.isNotEmpty())
            assertEquals(
                MediaType.valueOf("application/geopackage+sqlite3"),
                response.headers.contentType
            )
            assertTrue(response.headers.contentDisposition.isAttachment)
            assertTrue(response.headers.contentDisposition.filename?.endsWith(".gpkg") == true)
        }
    }
}
