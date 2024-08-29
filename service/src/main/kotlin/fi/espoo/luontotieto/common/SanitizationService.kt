// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.luontotieto.common

import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import org.springframework.stereotype.Service

@Service
class SanitizationService {
    fun sanitizeCsvCellData(cellData: String): String {
        val sanitizedData = escapeCsvInjection(cellData)
        return escapeSpecialCharacters(sanitizedData)
    }

    /**
     * Escapes dangerous characters in strings to prevent CSV injection.
     * Prepends dangerous characters with a single quote.
     */
    private fun escapeCsvInjection(value: String): String {
        return if (value.startsWith("=") || value.startsWith("+") ||
            value.startsWith("-") || value.startsWith("@") ||
            value.startsWith("|") || value.startsWith("\\")
        ) {
            "'$value"
        } else {
            value
        }
    }

    private fun escapeSpecialCharacters(cellData: String): String {
        return cellData
            .replace("\"", "\"\"") // Escape double quotes by doubling them
            .let { if (it.contains(",") || it.contains(";") || it.contains("\"")) "\"$it\"" else it }
    }

    /**
     * Sanitizes HTML content using JSoup.
     * Removes dangerous tags and attributes.
     */
    fun sanitizeHtml(html: String): String {
        return Jsoup.clean(html, Safelist.basic())
    }
}
