// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserLoginPage } from 'auth/UserLoginPage'
import { FrontPage } from 'luontotieto/FrontPage'
import { OrderFormPage } from 'luontotieto/order/OrderFormPage'
import { ReportFormPage } from 'luontotieto/report/ReportFormPage'
import { NewUserPage } from 'luontotieto/user-management/NewUserPage'
import { UserListPage } from 'luontotieto/user-management/UserListPage'
import { UserManagementPage } from 'luontotieto/user-management/UserManagementPage'
import { UserSettingsPage } from 'luontotieto/user-management/UserSettingsPage'
import React, { Fragment } from 'react'
import { createBrowserRouter, Link, Navigate, Outlet } from 'react-router-dom'
import { theme } from 'shared/theme'
import styled, { ThemeProvider } from 'styled-components'

import { useAuthStatusQuery } from './api/hooks/auth'
import { AuthGuard } from './auth/AuthGuard'
import { LoginPage } from './auth/LoginPage'
import { UserContextProvider } from './auth/UserContext'
import { UserHeader } from './auth/UserHeader'
import { FlexRowWithGaps } from './shared/layout'
import { H1 } from './shared/typography'

const EspooLogo = require('./images/EspooLogoPrimary.svg') as string

const Header = styled.nav`
  height: 80px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px double #888;
  margin-bottom: 32px;
  padding: 0 32px;
  background-color: #fff;
`
const queryClient = new QueryClient()

function App() {
  const { data: authStatus } = useAuthStatusQuery()
  if (!authStatus) return null

  const user = authStatus.loggedIn && authStatus.user ? authStatus.user : null

  return (
    <ThemeProvider theme={theme}>
      <UserContextProvider user={user}>
        <Fragment>
          <Header>
            <FlexRowWithGaps>
              <img src={EspooLogo} width="100px" alt="Espoon kaupunki" />
              <Link to="/luontoselvitys">
                <H1>Luontotietoportaali</H1>
              </Link>
            </FlexRowWithGaps>
            <UserHeader />
          </Header>
          <Outlet />
        </Fragment>
      </UserContextProvider>
    </ThemeProvider>
  )
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ),
    children: [
      {
        path: '/kirjaudu',
        element: (
          <AuthGuard allow="UNAUTHENTICATED_ONLY">
            <LoginPage />
          </AuthGuard>
        )
      },
      {
        path: '/kirjaudu/yrityskayttaja',
        element: (
          <AuthGuard allow="UNAUTHENTICATED_ONLY">
            <UserLoginPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <FrontPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/tilaus/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <OrderFormPage mode="CREATE" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/tilaus/:id/muokkaa',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <OrderFormPage mode="EDIT" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/selvitys/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <ReportFormPage mode="CREATE" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/selvitys/:id',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <ReportFormPage mode="EDIT" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/käyttäjät',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <UserListPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/käyttäjät/:id',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <UserManagementPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/käyttäjät/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <NewUserPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/omat-asetukset',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <UserSettingsPage />
          </AuthGuard>
        )
      },
      {
        path: '/*',
        element: <Navigate replace to="/luontotieto" />
      },
      {
        index: true,
        element: <Navigate replace to="/luontotieto" />
      }
    ]
  }
])
