// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import { PageContainer, SectionContainer, VerticalGap } from '../shared/layout'

import { OrderList } from './order/OrderList'
import { ReportList } from './report/ReportList'

export const FrontPage = React.memo(function FrontPage() {
  return (
    <PageContainer>
      <SectionContainer>
        <ReportList />
      </SectionContainer>
      <VerticalGap $size="L" />
      <SectionContainer>
        <OrderList />
      </SectionContainer>
    </PageContainer>
  )
})
