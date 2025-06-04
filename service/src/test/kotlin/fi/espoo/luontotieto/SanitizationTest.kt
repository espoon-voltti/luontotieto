// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.sanitizeCsvCellData
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class SanitizationTest {
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
                "\"'=SUM(12+13)\"",
                "\"'+1+1\"",
                "\"'-1-2\"",
                "\"'@A1\"",
                "\"'\\tTROUBLE\"",
                "\"'\\rCRLF\"",
                "\"Text, with, commas\"",
                "\"Text;with;semicolons\"",
                "\"Text with \"\"quotes\"\"\""
            )

        dangerousInputs.forEachIndexed { index, input ->
            val processedData = sanitizeCsvCellData(input)
            assertEquals((expectedOutputs[index]), processedData)
        }
        throw IllegalStateException("")
    }
}
