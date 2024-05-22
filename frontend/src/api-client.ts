// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import axios, { AxiosError } from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  xsrfCookieName: 'luontotieto.xsrf'
})

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err instanceof AxiosError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request: XMLHttpRequest | undefined = err.request
      const responseURL = request?.responseURL
      if (
        err.response?.status === 401 &&
        !responseURL?.endsWith('/auth/password/login')
      ) {
        window.location.reload()
      }
    }

    return Promise.reject(err)
  }
)
