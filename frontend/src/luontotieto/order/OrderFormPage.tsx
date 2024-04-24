// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import { FlexRight, PageContainer, VerticalGap } from '../../shared/layout'

import { OrderForm } from './OrderForm'
import {
  Order,
  OrderFile,
  OrderFormInput,
  apiGetOrder,
  apiGetOrderFiles,
  apiGetPlanNumbers,
  apiPostOrder,
  apiPutOrder
} from 'api/order-api'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'

interface CreateProps {
  mode: 'CREATE'
  referer?: string
}

interface EditProps {
  mode: 'EDIT'
  referer?: string
}
type Props = CreateProps | EditProps

export const OrderFormPage = React.memo(function OrderFormPage(props: Props) {
  const { state } = useLocation()

  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const [orderInput, setOrderInput] = useState<OrderFormInput | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderFiles, setOrderFiles] = useState<OrderFile[] | null>(null)
  const [planNumbers, setPlanNumbers] = useState<string[]>([])

  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    void apiGetPlanNumbers().then(setPlanNumbers)

    if (props.mode === 'EDIT' && id) {
      void apiGetOrder(id).then(setOrder)
      void apiGetOrderFiles(id).then(setOrderFiles)
    }
  }, [props, id])

  return (
    <>
      <PageContainer>
        <BackNavigation
          text={
            order?.name
              ? `Muokkaa tilausta: ${order?.name}`
              : 'Uusi luontoselvitys'
          }
          destination={state.referer}
        />
        <VerticalGap $size="s" />
        {props.mode == 'CREATE' && (
          <OrderForm
            mode="CREATE"
            onChange={setOrderInput}
            planNumbers={planNumbers}
          />
        )}

        {props.mode == 'EDIT' && order && orderFiles && (
          <OrderForm
            mode="EDIT"
            order={order}
            orderFiles={orderFiles}
            onChange={setOrderInput}
            planNumbers={planNumbers}
          />
        )}
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
                  .then((reportId) =>
                    navigate(`/luontotieto/selvitys/${reportId}`)
                  )
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
