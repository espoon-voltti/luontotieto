// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  Order,
  OrderFile,
  apiGetOrder,
  apiGetOrderFiles,
  apiPostOrderReport
} from 'api/order-api'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AddButton } from 'shared/buttons/AddButton'

import {
  FlexLeftRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H1, Label } from '../../shared/typography'

export const OrderPage = React.memo(function OrderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  if (!id) throw Error('Id not found in path')
  const [order, setOrder] = useState<Order | null>(null)
  const [orderFiles, setOrderFiles] = useState<OrderFile[]>([])

  const createOrderReport = async (orderId: string) => {
    const report = await apiPostOrderReport(orderId)
    if (report.id) {
      navigate(`/luontotieto/selvitys/${report.id}/muokkaa`)
    }
  }

  useEffect(() => {
    void apiGetOrder(id).then(setOrder)
    void apiGetOrderFiles(id).then(setOrderFiles)
  }, [id])

  return (
    <PageContainer>
      <SectionContainer>
        <FlexLeftRight>
          <H1>Tilaus</H1>
          <AddButton
            text="Luo uusi selvitys"
            onClick={() => createOrderReport(id)}
            data-qa="create-order-button"
          />
        </FlexLeftRight>
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
        <Label>Tiedostot:</Label>
        <ul>
          {orderFiles.map((rf) => (
            <li key={rf.id}>
              <code>{`${rf.fileName} :: ${rf.mediaType} :: ${rf.documentType}`}</code>
            </li>
          ))}
        </ul>
        <VerticalGap />
        <VerticalGap $size="m" />
      </SectionContainer>
    </PageContainer>
  )
})
