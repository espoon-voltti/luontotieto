// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H1 } from '../../shared/typography'

import { OrderForm } from './OrderForm'
import {
  Order,
  OrderFile,
  OrderFormInput,
  apiGetOrder,
  apiGetOrderFiles,
  apiPostOrder,
  apiPutOrder
} from 'api/order-api'
import { Footer } from 'shared/Footer'

interface CreateProps {
  mode: 'CREATE'
}

interface EditProps {
  mode: 'EDIT'
}
type Props = CreateProps | EditProps

export const OrderFormPage = React.memo(function OrderFormPage(props: Props) {
  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const [orderInput, setOrderInput] = useState<OrderFormInput | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderFiles, setOrderFiles] = useState<OrderFile[] | null>(null)

  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (props.mode === 'EDIT' && id) {
      void apiGetOrder(id).then(setOrder)
      void apiGetOrderFiles(id).then(setOrderFiles)
    }
  }, [props, id])

  return (
    <>
      <PageContainer>
        <SectionContainer>
          <H1>Tilaus</H1>
          <VerticalGap $size="m" />
          {props.mode == 'CREATE' && (
            <OrderForm mode="CREATE" onChange={setOrderInput} />
          )}

          {props.mode == 'EDIT' && order && orderFiles && (
            <OrderForm
              mode="EDIT"
              order={order}
              orderFiles={orderFiles}
              onChange={setOrderInput}
            />
          )}
        </SectionContainer>
      </PageContainer>
      <VerticalGap $size="XL" />
      <Footer>
        <FlexRight style={{ height: '100%' }}>
          <Button
            text="Tallenna"
            data-qa="save-button"
            primary
            disabled={!orderInput || submitting}
            onClick={() => {
              if (!orderInput) return
              setSubmitting(true)

              if (props.mode === 'CREATE') {
                apiPostOrder(orderInput)
                  .then((orderId) => navigate(`/luontotieto/tilaus/${orderId}`))
                  .catch(() => setSubmitting(false))
              } else {
                apiPutOrder(id!, orderInput)
                  .then((order) => navigate(`/luontotieto/tilaus/${order.id}`))
                  .catch(() => setSubmitting(false))
              }
            }}
          />
        </FlexRight>
      </Footer>
    </>
  )
})
