// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import { FlexRight, PageContainer, VerticalGap } from '../../shared/layout'

import { OrderForm } from './OrderForm'
import { OrderFormInput, apiPostOrder, apiPutOrder } from 'api/order-api'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import {
  useGetOrderFilesQuery,
  useGetOrderPlanNumbersQuery,
  useGetOrderQuery
} from 'api/hooks/orders'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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

  const queryClient = useQueryClient()

  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const { data: order, isLoading: isLoadingOrder } = useGetOrderQuery(id)
  const { data: orderFiles, isLoading: isLoadingOrderFiles } =
    useGetOrderFilesQuery(id)
  const { data: planNumbers } = useGetOrderPlanNumbersQuery()

  const [orderInput, setOrderInput] = useState<OrderFormInput | null>(null)

  const { mutateAsync: createOrderMutation, isPending: savingOrder } =
    useMutation({
      mutationFn: apiPostOrder,
      onSuccess: (reportId) => {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
        queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        navigate(`/luontotieto/selvitys/${reportId}/muokkaa`)
      }
    })

  const { mutateAsync: updateOrderMutation, isPending: updatingOrder } =
    useMutation({
      mutationFn: apiPutOrder,
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
        queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        navigate(`/luontotieto/selvitys/${order.id}`)
      }
    })

  if (isLoadingOrder || isLoadingOrderFiles) {
    return null
  }

  return (
    <>
      <PageContainer>
        <BackNavigation
          text={
            order?.name
              ? `Muokkaa tilausta: ${order?.name}`
              : 'Uusi luontoselvitys'
          }
          navigationText={
            props.mode === 'EDIT' ? 'Takaisin selvitykseen' : 'Etusivulle'
          }
          destination={state?.referer ?? undefined}
        />
        <VerticalGap $size="s" />
        {props.mode == 'CREATE' && (
          <OrderForm
            mode="CREATE"
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
          />
        )}

        {props.mode == 'EDIT' && order && orderFiles && (
          <OrderForm
            mode="EDIT"
            order={order}
            orderFiles={orderFiles}
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
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
            disabled={!orderInput || savingOrder || updatingOrder}
            onClick={async () => {
              if (!orderInput) return

              if (props.mode === 'CREATE') {
                await createOrderMutation(orderInput)
              } else {
                await updateOrderMutation({ ...orderInput, orderId: id! })
              }
            }}
          />
        </FlexRight>
      </Footer>
    </>
  )
})
