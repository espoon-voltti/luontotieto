// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.luontotieto.common

import org.unbescape.csv.CsvEscape

fun sanitizeCsvCellData(cellData: String): String {
    return CsvEscape.escapeCsv(escapeCsvInjection(cellData))
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
