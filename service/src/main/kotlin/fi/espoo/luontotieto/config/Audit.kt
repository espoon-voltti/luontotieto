// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import mu.KLogger
import net.logstash.logback.argument.StructuredArguments
import org.slf4j.Marker
import org.slf4j.MarkerFactory

val AUDIT_MARKER: Marker = MarkerFactory.getMarker("AUDIT_EVENT")

enum class AuditEvent {
    ADD_ORDER_FILE,
    ADD_REPORT_FILE,
    APPROVE_REPORT,
    CREATE_ORDER,
    CREATE_REPORT,
    DELETE_ORDER_FILE,
    DELETE_REPORT_FILE,
    UPDATE_ORDER,
    UPDATE_REPORT,
    USER_LOGIN,
    CREATE_REPORT_FOR_ORDER_ID
}

fun KLogger.audit(
    user: AuthenticatedUser,
    eventCode: AuditEvent,
    meta: Map<String, String> = emptyMap()
) {
    val data = mapOf<String, Any?>("userId" to user.id, "meta" to meta)
    warn(AUDIT_MARKER, eventCode.name, StructuredArguments.entries(data))
}
