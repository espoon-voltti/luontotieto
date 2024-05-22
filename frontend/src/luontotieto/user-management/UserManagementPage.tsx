// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useGetUserQuery } from 'api/hooks/users'
import React from 'react'
import { useParams } from 'react-router-dom'
import { BackNavigation } from 'shared/buttons/BackNavigation'

import { PageContainer, VerticalGap } from '../../shared/layout'

import { UserManagementForm } from './UserManagementForm'

export const UserManagementPage = React.memo(function UserManagementPage() {
  const { id } = useParams()
  if (!id) throw Error('Id not found in path')

  const { data: user, isLoading } = useGetUserQuery(id)

  if (isLoading || !user) {
    return null
  }

  return (
    <PageContainer>
      <BackNavigation
        text={user.name}
        navigationText="Käyttäjänhallinta"
        destination="/luontotieto/käyttäjät/"
      />

      <UserManagementForm user={user} />
      <VerticalGap $size="XL" />
    </PageContainer>
  )
})
