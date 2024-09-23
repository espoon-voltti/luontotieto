// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import styled from 'styled-components'

import { LinkStyledAsButton } from '../shared/buttons/LinkStyledAsButton'
import {
  FlexColWithGaps,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer
} from '../shared/layout'
import { H2 } from '../shared/typography'

const Wrapper = styled.div`
  width: 100%;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const redirectUri = (() => {
  if (window.location.pathname === '/kirjaudu') {
    return '/'
  }

  const params = new URLSearchParams(window.location.search)
  params.delete('loginError')

  const searchParams = params.toString()

  return `${window.location.pathname}${
    searchParams.length > 0 ? '?' : ''
  }${searchParams}${window.location.hash}`
})()

const getLoginUrl = () => {
  const relayState = encodeURIComponent(redirectUri)
  return `/api/auth/saml/login?RelayState=${relayState}`
}

export const LoginPage = React.memo(function LoginPage() {
  return (
    <PageContainer>
      <SectionContainer>
        <Wrapper>
          <FlexColWithGaps $gapSize="L">
            <H2>Kirjaudu sisään Luontotietoportaaliin</H2>
            <FlexRowWithGaps style={{ justifyContent: 'center' }}>
              <LinkStyledAsButton
                href={getLoginUrl()}
                style={{ marginRight: '32px' }}
              >
                Espoo AD
              </LinkStyledAsButton>
              <LinkStyledAsButton href="/kirjaudu/yrityskayttaja">
                Yrityskäyttäjä
              </LinkStyledAsButton>
            </FlexRowWithGaps>
          </FlexColWithGaps>
        </Wrapper>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
  )
})
