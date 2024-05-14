// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from '../api-client'

import { JsonOf } from '../shared/api-utils'

import { EmployeeUser } from '../auth/UserContext'

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

export const apiPostLogin = async (emailAndPassword: { email: string, password: string }) => {
    return apiClient.post(
        `/auth/password/login`,
        emailAndPassword
    ).then(res => res.status === 200)
}


