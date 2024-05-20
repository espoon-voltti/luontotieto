// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.AuthenticatedUser
import fi.espoo.luontotieto.domain.UserRole
import java.util.UUID

val adminUser = AuthenticatedUser(UUID.randomUUID(), UserRole.ADMIN)
val customerUser = AuthenticatedUser(UUID.randomUUID(), UserRole.CUSTOMER)
