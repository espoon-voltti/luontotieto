// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.SanitizationService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class SanitizationServiceTest {
    private lateinit var sanitizationService: SanitizationService

    @BeforeEach
    fun setUp() {
        sanitizationService = SanitizationService()
    }

    @Test
    fun `test cell data processing and validation`() {
        val dangerousInputs =
            listOf(
                // Dangerous prefix
                "=SUM(12+13)",
                // Dangerous prefix
                "+1+1",
                // Dangerous prefix
                "-1-2",
                // Dangerous prefix
                "@A1",
                // Dangerous prefix
                "\\tTROUBLE",
                // Dangerous prefix
                "\\rCRLF",
                // Special character: comma
                "Text, with, commas",
                // Special character: semicolon
                "Text;with;semicolons",
                // Special character: double quotes
                "Text with \"quotes\""
            )

        val expectedOutputs =
            listOf(
                "'=SUM(12+13)",
                "'+1+1",
                "'-1-2",
                "'@A1",
                "'\\tTROUBLE",
                "'\\rCRLF",
                "\"Text, with, commas\"",
                "\"Text;with;semicolons\"",
                "\"Text with \"\"quotes\"\"\""
            )

        dangerousInputs.forEachIndexed { index, input ->
            val processedData = sanitizationService.sanitizeCsvCellData(input)
            assertEquals((expectedOutputs[index]), processedData)
        }
    }

    @Test
    fun `test HTML sanitization`() {
        val htmlInput = "<div><script>alert('XSS')</script><b>Bold</b><i>Italic</i></div>"
        val expectedOutput = "<b>Bold</b><i>Italic</i>"

        val sanitizedHtml = sanitizationService.sanitizeHtml(htmlInput)
        assertEquals(expectedOutput, sanitizedHtml)
    }
}
