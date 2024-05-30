// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useGetOrderFilesQuery,
  useGetOrderPlanNumbersQuery,
  useGetOrderQuery,
  useGetorderingUnitsQuery
} from 'api/hooks/orders'
import { apiPostOrder, apiPutOrder, OrderFormInput } from 'api/order-api'
import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'

import { FlexRight, PageContainer, VerticalGap } from '../../shared/layout'

import { OrderForm } from './OrderForm'

interface CreateProps {
  mode: 'CREATE'
  referer?: string
}

interface EditProps {
  mode: 'EDIT'
  referer?: string
}

type Props = CreateProps | EditProps

interface LocationState {
  state: {
    referer: string
  }
}

export const OrderFormPage = React.memo(function OrderFormPage(props: Props) {
  const location: LocationState = useLocation()
  const queryClient = useQueryClient()

  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const { data: order, isLoading: isLoadingOrder } = useGetOrderQuery(id)
  const { data: orderFiles, isLoading: isLoadingOrderFiles } =
    useGetOrderFilesQuery(id)
  const { data: planNumbers } = useGetOrderPlanNumbersQuery()
  const { data: orderingUnits } = useGetorderingUnitsQuery()

  const [orderInput, setOrderInput] = useState<OrderFormInput | null>(null)

  const { mutateAsync: createOrderMutation, isPending: savingOrder } =
    useMutation({
      mutationFn: apiPostOrder,
      onSuccess: (reportId) => {
        void queryClient.invalidateQueries({ queryKey: ['order', id] })
        void queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        void queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        void queryClient.invalidateQueries({ queryKey: ['ordering-units'] })
        navigate(`/luontotieto/selvitys/${reportId}`)
      }
    })

  const { mutateAsync: updateOrderMutation, isPending: updatingOrder } =
    useMutation({
      mutationFn: apiPutOrder,
      onSuccess: (_order): void => {
        void queryClient.invalidateQueries({ queryKey: ['order', id] })
        void queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        void queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        void queryClient.invalidateQueries({ queryKey: ['ordering-units'] })

        navigate(`/`)
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
          destination={location.state?.referer ?? undefined}
        />
        <VerticalGap $size="s" />
        {props.mode == 'CREATE' && (
          <OrderForm
            mode="CREATE"
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
            orderingUnits={orderingUnits ?? []}
          />
        )}

        {props.mode == 'EDIT' && order && orderFiles && (
          <OrderForm
            mode="EDIT"
            order={order}
            orderFiles={orderFiles}
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
            orderingUnits={orderingUnits ?? []}
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
