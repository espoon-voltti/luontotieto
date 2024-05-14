// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from '../api-client'
import { JsonOf } from '../shared/api-utils'

import { EmployeeUser } from './UserContext'

export interface AuthStatus {
    loggedIn: boolean
    user?: EmployeeUser
    apiVersion: string
}

export async function getAuthStatus(): Promise<AuthStatus> {
    return apiClient
        .get<JsonOf<AuthStatus>>('/auth/status')
        .then((res) => res.data)
}

