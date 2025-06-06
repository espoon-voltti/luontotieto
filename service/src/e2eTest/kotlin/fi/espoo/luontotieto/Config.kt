// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

val runningInDocker = System.getenv("E2E_ENV") == "docker"
val baseUrl = if (runningInDocker) "http://frontend" else "http://localhost:9000"

const val E2E_DEBUG_LOGGING = false
