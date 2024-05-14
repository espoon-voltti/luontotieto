// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'

import { FlexRowWithGaps } from '../shared/layout'

import { UserContext } from './UserContext'
import { UserMenu } from './UserMenu'

export const logoutUrl = `/api/auth/saml/logout?RelayState=/kirjaudu`

export const UserHeader = React.memo(function UserHeader() {
  const { user } = useContext(UserContext)

  if (!user) return null

  return (
    <FlexRowWithGaps>
      <UserMenu userName={user.name}></UserMenu>
    </FlexRowWithGaps>
  )
})
