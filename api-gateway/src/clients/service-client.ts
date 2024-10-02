// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from 'express'
import axios, { AxiosError } from 'axios'
import { AppSessionUser, createAuthHeader } from '../auth/index.js'
import { serviceUrl } from '../config.js'
import { logError } from '../logging/index.js'

export const client = axios.create({
  baseURL: serviceUrl
})

const systemUser: AppSessionUser = {
  id: '00000000-0000-0000-0000-000000000000'
}

export type ServiceRequestHeader = 'Authorization' | 'X-Request-ID'

export type ServiceRequestHeaders = { [H in ServiceRequestHeader]?: string }

export function createServiceRequestHeaders(
  req: express.Request | undefined,
  user: AppSessionUser | undefined | null = req?.user
) {
  const headers: ServiceRequestHeaders = {}
  if (user) {
    headers.Authorization = createAuthHeader(user)
  }
  return headers
}

export interface AdUser {
  externalId: string
  name: string
  email?: string | null
}

export interface PasswordUser {
  passwordUpdated: boolean
}

// currently same
export interface AppUser extends AdUser, PasswordUser {
  id: string
}

export async function userLogin(adUser: AdUser): Promise<AppUser> {
  const res = await client.post<AppUser>(`/system/user-login`, adUser, {
    headers: createServiceRequestHeaders(undefined, systemUser)
  })
  return res.data
}

export async function getUserDetails(
  req: express.Request,
  userId: string
): Promise<AppUser | undefined> {
  const { data } = await client.get<AppUser | undefined>(
    `/system/users/${userId}`,
    {
      headers: createServiceRequestHeaders(req, systemUser)
    }
  )
  return data
}

export async function postPasswordLogin(email: string, password: string) {
  try {
    const { data } = await client.post<AppUser>(
      `/system/password-login`,
      { email, password },
      {
        headers: createServiceRequestHeaders(undefined, systemUser)
      }
    )
    return data
  } catch (e) {
    if (e instanceof AxiosError) {
      logError('Login failed with expected error', undefined, undefined, e)
      return { errorCode: e.response?.data?.errorCode ?? 'wrong-credentials' }
    }

    logError(
      'Login failed with unexpected error',
      undefined,
      undefined,
      e as Error
    )
    return { errorCode: 'unknown-error' }
  }
}
