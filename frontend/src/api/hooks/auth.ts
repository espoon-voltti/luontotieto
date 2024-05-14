// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useQuery } from '@tanstack/react-query'
import { getAuthStatus } from '../../auth/auth-status'
import { loginApiClient } from '../../api-client'


export function useAuthStatusQuery() {
    return useQuery({
        queryFn: getAuthStatus,
        queryKey: ['auth-status']
    })
}

export const apiPostLogin = async (email: string, password: string) => {
    return loginApiClient.post(
        `/auth/password/login`,
        {email, password}
    ).then(res => res.status === 200)
}


