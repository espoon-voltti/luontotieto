// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useQuery } from '@tanstack/react-query'
import { apiGetUser, apiGetUsers } from 'api/users-api'

export function useGetUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiGetUsers()
  })
}

export function useGetUserQuery(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiGetUser(id)
  })
}
