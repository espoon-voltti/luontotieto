// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'

import { UserContext } from './UserContext'

type AuthMode =
  | 'AUTHENTICATED_WITH_UPDATED_PASSWORD_ONLY'
  | 'AUTHENTICATED_ONLY'
  | 'UNAUTHENTICATED_ONLY'
  | 'ALL'

export const AuthGuard = React.memo(function AuthGuard({
  allow,
  children
}: {
  allow: AuthMode
  children: React.JSX.Element
}) {
  const { user } = useContext(UserContext)

  switch (allow) {
    case 'ALL':
      return children
    case 'AUTHENTICATED_WITH_UPDATED_PASSWORD_ONLY':
      if (user) {
        if (user.passwordUpdated === false) {
          return <Navigate replace to="/luontotieto/omat-asetukset" />
        }
        return children
      } else {
        return <Navigate replace to="/kirjaudu" />
      }
    case 'AUTHENTICATED_ONLY': {
      if (user) {
        return children
      } else {
        return <Navigate replace to="/kirjaudu" />
      }
    }
    case 'UNAUTHENTICATED_ONLY':
      if (user) {
        return <Navigate replace to="/luontotieto" />
      } else {
        return children
      }
  }
})
