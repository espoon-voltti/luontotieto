// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import { FrontPage } from 'luontotieto/FrontPage'
import { CreateOrderPage } from 'luontotieto/order/CreateOrderPage'
import { OrderPage } from 'luontotieto/order/OrderPage'
import { CreateReportPage } from 'luontotieto/report/CreateReportPage'
import { ReportPage } from 'luontotieto/report/ReportPage'
import React, { Fragment } from 'react'
import { Navigate, createBrowserRouter, Outlet, Link } from 'react-router-dom'
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
            <Link to="/luontoselvitys">
              <H1>Luontotietoportaali</H1>
            </Link>
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
        path: '/luontotieto/tilaus/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <CreateOrderPage mode="CREATE" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/tilaus/:id',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <OrderPage />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/selvitys/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <CreateReportPage mode="CREATE" />
          </AuthGuard>
        )
      },
      {
        path: '/luontotieto/selvitys/:id',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <ReportPage />
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
