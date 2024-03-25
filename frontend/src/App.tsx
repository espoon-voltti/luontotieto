// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import { FrontPage } from 'luontotieto/FrontPage'
import React, { Fragment } from 'react'
import { Navigate, createBrowserRouter, Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { AuthGuard } from './auth/AuthGuard'
import { LoginPage } from './auth/LoginPage'
import { UserContextProvider } from './auth/UserContext'
import { UserHeader } from './auth/UserHeader'
import { useAuthStatus } from './auth/auth-status'
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

function App() {
  const authStatus = useAuthStatus()
  if (!authStatus) return null

  const user = authStatus.loggedIn && authStatus.user ? authStatus.user : null

  return (
    <UserContextProvider user={user}>
      <Fragment>
        <Header>
          <FlexRowWithGaps>
            <img src={EspooLogo} width="100px" alt="Espoon kaupunki" />
            <H1>Luontotieto portaali</H1>
          </FlexRowWithGaps>
          <UserHeader />
        </Header>
        <Outlet />
      </Fragment>
    </UserContextProvider>
  )
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
        path: '/luontotieto',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <FrontPage />
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
