// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later


import React from 'react'

import {
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../shared/layout'
import { Label } from '../shared/typography'


export const FrontPage = React.memo(function FrontPage() {
  return (
    <PageContainer>
      <SectionContainer $minHeight="600px">


        <Label>
          Etusivu
        </Label>

        <VerticalGap />

      </SectionContainer>
    </PageContainer>
  )
})
