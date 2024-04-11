// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import { PageContainer, SectionContainer, VerticalGap } from '../shared/layout'
import { Label } from '../shared/typography'

export const FrontPage = React.memo(function FrontPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <SectionContainer $minHeight="600px">
        <Label>Etusivu</Label>
        <Button
          onClick={() => {
            navigate('/luontotieto/tilaus/uusi')
          }}
          text="Luo uusi tilaus"
        />

        <Button
          onClick={() => {
            navigate('/luontotieto/selvitys/uusi')
          }}
          text="Luo uusi selvitys"
        />

        <VerticalGap />
      </SectionContainer>
    </PageContainer>
  )
})
