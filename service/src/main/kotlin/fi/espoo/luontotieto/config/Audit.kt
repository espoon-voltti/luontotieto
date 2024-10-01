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
    DELETE_ORDER_FILE,
    DELETE_REPORT_FILE,
    GET_ORDER_FILES,
    GET_ORDER_FILE_BY_ID,
    GET_REPORT_BY_ID,
    GET_REPORT_FILES,
    GET_REPORT_FILE_BY_ID,
    GET_REPORTS,
    GET_REPORTS_AS_CSV,
    GET_USER,
    GET_USERS,
    REOPEN_REPORT,
    RELOAD_GEOSEVER_CONFIGURATION,
    UPDATE_ORDER,
    UPDATE_REPORT,
    USER_LOGIN,
    PASSWORD_LOGIN,
    CREATE_USER,
    UPDATE_USER,
    UPDATE_USER_PASSWORD,
    RESET_USER_PASSWORD,
    DELETE_ORDER
}

fun KLogger.audit(
    user: AuthenticatedUser,
    eventCode: AuditEvent,
    meta: Map<String, String> = emptyMap()
) {
    val data = mapOf<String, Any?>("userId" to user.id, "meta" to meta)
    warn(AUDIT_MARKER, eventCode.name, StructuredArguments.entries(data))
}
