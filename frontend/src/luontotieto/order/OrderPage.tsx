// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  Order,
  apiGetOrder,
} from 'api'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PageContainer, SectionContainer, VerticalGap } from '../../shared/layout'
import { H1, Label } from '../../shared/typography'

export const OrderPage = React.memo(function OrderPage() {
  const { id } = useParams()
  if (!id) throw Error('Id not found in path')
  const [order, setOrder] = useState<Order | null>(null)



  useEffect(() => {
    void apiGetOrder(id).then(setOrder)
  }, [id])
  return (
    <PageContainer>
      <SectionContainer>
        <H1>Tilaus</H1>
        <VerticalGap $size="L" />
        <Label>Nimi:</Label> {order?.name}
        <VerticalGap />
        <Label>Kuvaus:</Label> {order?.description}
        <VerticalGap />
        <Label>Kaavanumero:</Label> {order?.planNumber}
        <VerticalGap />
        <Label>Pyydetyt dokumentit:</Label>
        <ul>
          {order?.reportDocuments.map((rf) => (
            <li key={rf.documentType}>
              <code>{`${rf.documentType} :: ${rf.description}`}</code>
            </li>
          ))}
        </ul>
        <VerticalGap />
      <VerticalGap $size="m" />
      </SectionContainer>

    </PageContainer>
  )
})