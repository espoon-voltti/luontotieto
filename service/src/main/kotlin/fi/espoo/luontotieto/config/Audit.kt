// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import mu.KLogger
import net.logstash.logback.argument.StructuredArguments
import org.slf4j.Marker
import org.slf4j.MarkerFactory

val AUDIT_MARKER: Marker = MarkerFactory.getMarker("AUDIT_EVENT")

object AuditEvents {
    const val ADD_ORDER_FILE = "ADD_ORDER_FILE"
    const val ADD_REPORT_FILE = "ADD_REPORT_FILE"
    const val APPROVE_REPORT = "APPROVE_REPORT"
    const val CREATE_ORDER = "CREATE_ORDER"
    const val CREATE_REPORT = "CREATE_REPORT"
    const val DELETE_ORDER_FILE = "DELETE_ORDER_FILE"
    const val DELETE_REPORT_FILE = "DELETE_REPORT_FILE"
    const val UPDATE_ORDER = "UPDATE_ORDER"
    const val UPDATE_REPORT = "UPDATE_REPORT"
    const val USER_LOGIN = "USER_LOGIN"
}

fun KLogger.audit(
    user: AuthenticatedUser,
    eventCode: String,
    meta: Map<String, String> = emptyMap()
) {
    val data = mapOf<String, Any?>("userId" to user.id, "meta" to meta)
    warn(AUDIT_MARKER, eventCode, StructuredArguments.entries(data))
}
