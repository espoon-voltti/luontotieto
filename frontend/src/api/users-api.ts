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

export interface UserFormInput {
  name: string
  email: string
}

export const apiPostUser = async (userInput: UserFormInput): Promise<User> => {
  const body: JsonOf<UserFormInput> = {
    ...userInput
  }

  return await apiClient.post<User>('/users', body).then((r) => r.data)
}

export const apiPutUser = async (
  userInput: { userId: string } & UserFormInput
): Promise<User> => {
  const body: JsonOf<UserFormInput> = {
    ...userInput
  }

  return await apiClient
    .put<User>(`/users/${userInput.userId}`, body)
    .then((r) => r.data)
}

export const apiGetUser = (id: string): Promise<User> =>
  apiClient.get<User>(`/users/${id}`).then((res) => res.data)

export const apiGetUsers = (): Promise<User[]> =>
  apiClient.get<User[]>(`/users`).then((res) => res.data)

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
