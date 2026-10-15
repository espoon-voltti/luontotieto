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

export type LoginErrorCode =
  | 'account-is-locked'
  | 'account-login-delay'
  | 'wrong-credentials'

export const LoginError: Record<LoginErrorCode, string> = {
  'account-is-locked': 'Tili on lukittu. Yritä uudelleen myöhemmin.',
  'account-login-delay':
    'Liian monta virheellistä yritystä. Odota hetki ennen kuin yrität uudelleen.',
  'wrong-credentials': 'Virheellinen sähköposti tai salasana'
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
