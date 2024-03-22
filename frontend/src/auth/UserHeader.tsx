// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'

import { FlexRowWithGaps } from '../shared/layout'

import { UserContext } from './UserContext'

export const logoutUrl = `/api/auth/saml/logout?RelayState=/kirjaudu`

export const UserHeader = React.memo(function UserHeader() {
  const { user } = useContext(UserContext)

  if (!user) return null

  return (
    <FlexRowWithGaps>
      <span data-qa="logged-in-user">
        {user.firstName} {user.lastName}
      </span>
      <a href={logoutUrl}>Kirjaudu ulos</a>
    </FlexRowWithGaps>
  )
})
