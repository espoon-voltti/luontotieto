// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { JsonOf } from 'shared/api-utils'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created: Date
  updated: Date
  active: boolean
  createdBy: string
  updatedBy: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ORDERER = 'ORDERER',
  VIEWER = 'VIEWER',
  CUSTOMER = 'CUSTOMER'
}

export interface CreateUserInput {
  name: string
  email: string
}
export interface UpdateUserInput {
  name: string
  email: string
  role: UserRole
  active: boolean
}

export const apiPostUser = async (
  userInput: CreateUserInput
): Promise<User> => {
  const body: JsonOf<CreateUserInput> = {
    ...userInput
  }

  return await apiClient.post<User>('/users', body).then((r) => r.data)
}

export const apiPutUser = async (
  userInput: { userId: string } & UpdateUserInput
): Promise<User> => {
  const body: JsonOf<UpdateUserInput> = {
    ...userInput
  }

  return await apiClient
    .put<User>(`/users/${userInput.userId}`, body)
    .then((r) => r.data)
}

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordErrorCode =
  | 'wrong-current-password'
  | 'new-password-already-in-use'
  | 'weak-password'

export const ChangePasswordError: Record<ChangePasswordErrorCode, string> = {
  'wrong-current-password': 'Väärä nykyinen salasana',
  'new-password-already-in-use':
    'Uusi salasana ei saa olla sama kuin nykyinen salana',
  'weak-password':
    'Syötä vahva salasana jossa on: vähintään 12 merkkiä, yksi iso kirjain, yksi pieni kirjain ja yksi numero.'
}

export const apiChangeUserPassword = async (
  userInput: {
    userId: string
  } & ChangePasswordPayload
): Promise<string> => {
  const body: JsonOf<ChangePasswordPayload> = {
    ...userInput
  }

  return await apiClient
    .put<string>(`/users/password`, body)
    .then((r) => r.data)
}

export const apiResetUserPassword = async (userInput: {
  userId: string
}): Promise<string> =>
  await apiClient
    .put<string>(`/users/${userInput.userId}/password/reset`)
    .then((r) => r.data)

export const apiGetUser = (id: string): Promise<User> =>
  apiClient.get<User>(`/users/${id}`).then((res) => res.data)

export const apiGetUsers = (params?: {
  includeInactive?: boolean
}): Promise<User[]> =>
  apiClient.get<User[]>(`/users`, { params }).then((res) => res.data)

export function getUserRole(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return 'Pääkäyttäjä'
    case UserRole.ORDERER:
      return 'Tilaaja'
    case UserRole.VIEWER:
      return 'Katselija'
    case UserRole.CUSTOMER:
      return 'Yrityskäyttäjä'
    default:
      return 'Puuttuu'
  }
}
