// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useGetUsersQuery } from 'api/hooks/users'
import { getUserRole, User } from 'api/users-api'
import orderBy from 'lodash/orderBy'
import React, { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SortableTh, Th } from 'shared/Table'
import { AddButton } from 'shared/buttons/AddButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { InputField } from 'shared/form/InputField'
import { H2 } from 'shared/typography'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  FlexLeftRight,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'
import AccessibilityFooter from 'shared/AccessibilityFooter'

export type UserSortColumn = 'role' | 'active'
export type SortDirection = 'ASC' | 'DESC'

export const UserListPage = React.memo(function UserListPage() {
  const navigate = useNavigate()

  const { data: users, isLoading } = useGetUsersQuery()

  const [sortBy, setSortBy] = useState<UserSortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')

  const [filterBySearchQuery, setFilterBySearchQuery] = useDebouncedState<
    string | null
  >(null)

  const isSorted = (column: UserSortColumn) =>
    sortBy === column ? sortDirection : undefined

  const toggleSort = (column: UserSortColumn) => () => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortDirection('ASC')
    }
  }

  const orderUsers = useCallback(
    (users: User[]) => {
      const filtered = filterUsers(users, filterBySearchQuery)

      return sortBy === null
        ? filtered
        : orderBy(
            filtered,
            [sortBy],
            [sortDirection === 'ASC' ? 'asc' : 'desc']
          )
    },
    [sortBy, sortDirection, filterBySearchQuery]
  )

  if (isLoading || !users) {
    return null
  }
  return (
    <PageContainer>
      <BackNavigation text="Käyttäjähallinta" navigationText="Etusivulle" />

      <SectionContainer>
        <H2>Käyttäjät</H2>
        <VerticalGap $size="m" />
        <FlexLeftRight>
          <FlexRowWithGaps $gapSize="s">
            <InputField
              onChange={setFilterBySearchQuery}
              value={filterBySearchQuery ?? ''}
              placeholder="Haku"
              icon={faSearch}
              $clearable={true}
              backgroundColor="#F7F7F7"
            />
          </FlexRowWithGaps>

          <AddButton
            text="Lisää yrityskäyttäjä"
            onClick={() => navigate('/luontotieto/käyttäjät/uusi')}
          />
        </FlexLeftRight>

        <VerticalGap $size="L" />

        <Table style={{ width: '100%' }}>
          <thead>
            <tr>
              <Th style={{ width: '300px' }}>Nimi</Th>
              <Th style={{ width: '300px' }}>Yhteyssähköposti</Th>
              <SortableTh
                sorted={isSorted('role')}
                onClick={toggleSort('role')}
              >
                Käyttöoikeudet
              </SortableTh>
              <SortableTh
                sorted={isSorted('active')}
                onClick={toggleSort('active')}
              >
                Tila
              </SortableTh>
            </tr>
          </thead>
          <tbody>
            {orderUsers(users).map((user) => (
              <tr key={user.id}>
                <td>
                  <Link to={`/luontotieto/käyttäjät/${user.id}`}>
                    {user.name}
                  </Link>
                </td>
                <td>{user.email?.toLowerCase() ?? ''}</td>
                <td style={{ textTransform: 'capitalize' }}>
                  {getUserRole(user.role)}
                </td>
                <td>{user.active ? 'Aktiivinen' : 'Epäaktiivinen'}</td>
              </tr>
            ))}
            {users.length == 0 && (
              <tr>
                <td colSpan={4}>Ei näytettäviä käyttäjiä</td>
              </tr>
            )}
          </tbody>
        </Table>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
  )
})

const filterUsers = (users: User[], searchQuery: string | null): User[] => {
  const searchQueryToLower = searchQuery ? searchQuery.toLowerCase() : null
  return users.filter((user) => {
    if (searchQueryToLower === null) {
      return true
    }
    if (searchQueryToLower) {
      return (
        user.name.toLowerCase().includes(searchQueryToLower) ||
        user.email?.toLowerCase().includes(searchQueryToLower)
      )
    }
    return true
  })
}
