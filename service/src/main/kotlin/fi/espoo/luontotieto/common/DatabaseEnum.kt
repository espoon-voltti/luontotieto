// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.common

import org.jdbi.v3.core.enums.DatabaseValue

interface DatabaseEnum {
    val sqlType: String
}

fun DatabaseEnum.databaseValue() =
    when (this) {
        is Enum<*> ->
            this.declaringJavaClass
                .getField(this.name)
                .getAnnotation(DatabaseValue::class.java)
                .value
        else -> null
    }
