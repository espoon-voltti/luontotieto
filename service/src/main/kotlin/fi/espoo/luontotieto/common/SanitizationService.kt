// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.luontotieto.common

import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import org.springframework.stereotype.Service
import kotlin.reflect.KMutableProperty
import kotlin.reflect.full.memberProperties


@Service
class SanitizationService {

    /**
     * Sanitizes the entire object by processing all properties.
     */
    fun <T : Any> sanitizeObject(obj: T): T {
        obj::class.memberProperties.forEach { prop ->
            if (prop is KMutableProperty<*>) {
                val value = prop.getter.call(obj)
                when (value) {
                    is String -> {
                        // Sanitize String properties
                        val sanitizedValue = sanitizeString(value)
                        prop.setter.call(obj, sanitizedValue)
                    }

                    is List<*> -> {
                        // Sanitize lists of strings or nested objects
                        val sanitizedList = value.map { item ->
                            if (item is String) sanitizeString(item) else sanitizeObject(item!!)
                        }
                        prop.setter.call(obj, sanitizedList)
                    }

                    is Map<*, *> -> {
                        // Sanitize maps with string keys/values or nested objects
                        val sanitizedMap = value.mapValues { (_, mapValue) ->
                            if (mapValue is String) sanitizeString(mapValue) else sanitizeObject(mapValue!!)
                        }
                        prop.setter.call(obj, sanitizedMap)
                    }

                    is Any -> {
                        // Recursively sanitize nested objects
                        if (!isPrimitiveOrString(value)) {
                            sanitizeObject(value)
                        }
                    }
                }
            }
        }
        return obj
    }

    /**
     * Sanitizes a String by escaping CSV injection and cleaning HTML.
     */
    private fun sanitizeString(value: String): String {
        val sanitizedForCsv = escapeCsvInjection(value)
        return sanitizeHtml(sanitizedForCsv)
    }

    /**
     * Escapes dangerous characters to prevent CSV injection.
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

    /**
     * Sanitizes HTML content using JSoup.
     */
    fun sanitizeHtml(html: String): String {
        return Jsoup.clean(html, Safelist.basic())
    }

    /**
     * Determines if a value is a primitive type or String.
     */
    fun isPrimitiveOrString(value: Any): Boolean {
        return value::class.javaPrimitiveType != null || value is String
    }
}