// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { UserRole } from 'api/users-api'
import React, { createContext, useMemo } from 'react'

export interface AppUser {
  id: string
  name: string
  email?: string | null
  role: UserRole
  externalId?: string
}

export interface UserState {
  user: AppUser | null
}

export function hasOrdererRole(user: AppUser | null) {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.ORDERER
}

export const UserContext = createContext<UserState>({
  user: null
})

export const UserContextProvider = React.memo(function UserContextProvider({
  children,
  user
}: {
  children: React.JSX.Element
  user: AppUser | null
}) {
  const value = useMemo(
    () => ({
      user
    }),
    [user]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
})
