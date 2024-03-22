// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import mu.KLogger
import net.logstash.logback.argument.StructuredArguments
import org.slf4j.Marker
import org.slf4j.MarkerFactory

val AUDIT_MARKER: Marker = MarkerFactory.getMarker("AUDIT_EVENT")

fun KLogger.audit(
    user: AuthenticatedUser,
    eventCode: String,
    meta: Map<String, String> = emptyMap()
) {
    val data =
        mapOf<String, Any?>(
            "userId" to user.id,
            "meta" to meta
        )
    warn(AUDIT_MARKER, eventCode, StructuredArguments.entries(data))
}
