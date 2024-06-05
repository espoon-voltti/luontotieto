// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from './buttons/Button'
import { PageContainer, SectionContainer, VerticalGap } from './layout'
import { H2, P } from './typography'

const CenteredDiv = styled.div`
  margin: 0 auto;
  text-align: center;
  max-width: 498px;

  & > button {
    margin: 0 auto;
  }
`

export const NotFound = React.memo(function NotFound() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <SectionContainer>
        <CenteredDiv>
          <VerticalGap $size="XL" />
          <H2>Sivua ei löytynyt</H2>
          <VerticalGap $size="L" />
          <P>
            Voi olla, että sivun osoite on väärin, sivu on poistettu palvelusta
            tai sinulla ei ole oikeuksia nähdä sitä.
          </P>
          <VerticalGap $size="L" />
          <Button
            text="Palaa etusivulle"
            primary
            onClick={() => navigate('/')}
          />
          <VerticalGap $size="XL" />
        </CenteredDiv>
      </SectionContainer>
    </PageContainer>
  )
})
