// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useQuery } from '@tanstack/react-query'

import { getAuthStatus } from '../auth-api'

export function useAuthStatusQuery() {
  return useQuery({
    queryFn: getAuthStatus,
    queryKey: ['auth-status']
  })
}
