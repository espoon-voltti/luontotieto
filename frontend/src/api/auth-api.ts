// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { AppUser } from 'auth/UserContext'

import { apiClient } from '../api-client'
import { JsonOf } from '../shared/api-utils'

export interface AuthStatus {
  loggedIn: boolean
  user?: AppUser
  apiVersion: string
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return apiClient
    .get<JsonOf<AuthStatus>>('/auth/status')
    .then((res) => res.data)
}

export const apiPostLogin = async (emailAndPassword: {
  email: string
  password: string
}) =>
  apiClient
    .post(`/auth/password/login`, emailAndPassword)
    .then((res) => res.status === 200)

export const apiPostLogout = async () =>
  apiClient.post(`/auth/password/logout`).then((res) => res.status === 200)

export const apiPostAnonymousLogin = async () =>
  apiClient.post(`/auth/anonymous/login`).then((res) => res.status === 200)
