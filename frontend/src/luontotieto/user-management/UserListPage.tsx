// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddButton } from 'shared/buttons/AddButton'

import {
  FlexLeftRight,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'
import { InputField } from 'shared/form/InputField'
import { SortableTh, Th } from 'shared/Table'
import { orderBy } from 'lodash'
import { useDebouncedState } from 'shared/useDebouncedState'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { User, userlist } from './users'
import { BackNavigation } from 'shared/buttons/BackNavigation'

export type UserSortColumn = 'role' | 'active'
export type SortDirection = 'ASC' | 'DESC'

export const UserListPage = React.memo(function UserListPage() {
  const navigate = useNavigate()
  const [users, _] = useState<User[]>(userlist)

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

  return (
    <PageContainer>
      <BackNavigation text={'Käyttäjänhallinta'} navigationText="Etusivulle" />

      <SectionContainer>
        <VerticalGap $size="m" />
        <FlexLeftRight>
          <FlexRowWithGaps $gapSize="s">
            <InputField
              onChange={setFilterBySearchQuery}
              value={filterBySearchQuery ?? ''}
              placeholder="Haku"
              icon={faSearch}
              clearable={true}
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
                    {user.userName}
                  </Link>
                </td>
                <td>{user.email.toLowerCase()}</td>
                <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
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
    </PageContainer>
  )
})

const filterUsers = (users: any[], searchQuery: string | null): User[] => {
  const searchQueryToLower = searchQuery ? searchQuery.toLowerCase() : null
  return users.filter((user) => {
    if (searchQueryToLower === null) {
      return true
    }
    if (searchQueryToLower) {
      return (
        user.userName.toLowerCase().includes(searchQueryToLower) ||
        user.email.toLowerCase().includes(searchQueryToLower)
      )
    }
    return true
  })
}