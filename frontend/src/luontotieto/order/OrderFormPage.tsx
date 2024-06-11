// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useGetOrderFilesQuery,
  useGetorderingUnitsQuery,
  useGetOrderPlanNumbersQuery,
  useGetOrderQuery
} from 'api/hooks/orders'
import {
  apiDeleteOrder,
  apiPutOrder,
  apiUpsertOrder,
  DeleteOrderError,
  DeleteorderErrorCode,
  OrderFileValidationErrorResponse,
  OrderFormInput
} from 'api/order-api'
import { hasOrdererRole, UserContext } from 'auth/UserContext'
import { AxiosError } from 'axios'
import React, { useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'

import { NotFound } from '../../shared/404'
import {
  FlexLeftRight,
  FlexRight,
  PageContainer,
  VerticalGap
} from '../../shared/layout'

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
  const { user } = useContext(UserContext)

  const location: LocationState = useLocation()
  const queryClient = useQueryClient()

  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  // Use this to store order id in case of order file saving error
  const [orderId, setOrderId] = useState<string | undefined>(undefined)

  const { data: order, isLoading: isLoadingOrder } = useGetOrderQuery(id)
  const { data: orderFiles, isLoading: isLoadingOrderFiles } =
    useGetOrderFilesQuery(id)
  const { data: planNumbers } = useGetOrderPlanNumbersQuery()
  const { data: orderingUnits } = useGetorderingUnitsQuery()

  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)
  const [orderInput, setOrderInput] = useState<OrderFormInput | null>(null)

  const showDeleteButton = useMemo(
    () => props.mode === 'EDIT' && hasOrdererRole(user),
    [props.mode, user]
  )

  const [orderFileErrors, setOrderFileErrors] = useState<
    OrderFileValidationErrorResponse[]
  >([])

  const { mutateAsync: createOrderMutation, isPending: savingOrder } =
    useMutation({
      mutationFn: apiUpsertOrder,
      onSuccess: ({ orderId, reportId }) => {
        void queryClient.invalidateQueries({ queryKey: ['order', id] })
        void queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        void queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        void queryClient.invalidateQueries({ queryKey: ['ordering-units'] })
        setOrderId(orderId)

        setShowModal({
          title: 'Tilaus luotu',
          resolve: {
            action: () => {
              setShowModal(null)
              navigate(`/luontotieto/selvitys/${reportId}`)
            },
            label: 'Ok'
          }
        })
      },
      onError: (error: OrderFileValidationErrorResponse | null) => {
        error && setOrderFileErrors([error])
        setOrderId(error?.orderId)
        setShowModal({
          title: 'Tilauksen luonti epäonnistui',
          resolve: {
            action: () => {
              setShowModal(null)
            },
            label: 'Ok'
          }
        })
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
        setShowModal({
          title: 'Tilaus päivitetty',
          resolve: {
            action: () => {
              setShowModal(null)
            },
            label: 'Ok'
          }
        })
      },
      onError: (error: OrderFileValidationErrorResponse | null) => {
        error && setOrderFileErrors([error])
        setShowModal({
          title: 'Tilauksen päivitys epäonnistui',
          resolve: {
            action: () => {
              setShowModal(null)
            },
            label: 'Ok'
          }
        })
      }
    })

  const { mutateAsync: deleteOrderMutation, isPending: deletingOrder } =
    useMutation({
      mutationFn: apiDeleteOrder,
      onSuccess: (_order): void => {
        void queryClient.invalidateQueries({ queryKey: ['order', id] })
        void queryClient.invalidateQueries({ queryKey: ['orderFiles', id] })
        void queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
        void queryClient.invalidateQueries({ queryKey: ['ordering-units'] })
        setShowModal({
          title: 'Tilaus poistettu',
          resolve: {
            action: () => {
              setShowModal(null)
              navigate(`/luontotieto`)
            },
            label: 'Ok'
          }
        })
      },
      onError: (e: AxiosError<{ errorCode: DeleteorderErrorCode }>) => {
        if (e instanceof AxiosError) {
          const errorCode = e.response?.data.errorCode
          const errorMessage = errorCode
            ? DeleteOrderError[errorCode]
            : 'Odottamaton virhe'
          setShowModal({
            title: 'Tilauksen poisto epännistui',
            text: errorMessage,
            resolve: {
              action: () => {
                setShowModal(null)
              },
              label: 'Ok'
            }
          })
        }
      }
    })

  if (isLoadingOrder || isLoadingOrderFiles) {
    return null
  }

  if (!order && props.mode === 'EDIT') {
    return <NotFound />
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
            key={order?.updated.toString()}
            mode="CREATE"
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
            orderingUnits={orderingUnits ?? []}
            errors={orderFileErrors}
          />
        )}

        {props.mode == 'EDIT' && order && orderFiles && (
          <OrderForm
            key={order.updated.toString()}
            mode="EDIT"
            order={order}
            orderFiles={orderFiles}
            onChange={setOrderInput}
            planNumbers={planNumbers ?? []}
            orderingUnits={orderingUnits ?? []}
            errors={orderFileErrors}
          />
        )}
      </PageContainer>
      <VerticalGap $size="XL" />
      <Footer>
        <FlexLeftRight>
          <>
            {showDeleteButton && (
              <Button
                text="Poista selvitystilaus"
                className="danger"
                data-qa="save-button"
                disabled={deletingOrder}
                onClick={() => {
                  if (order) {
                    setShowModal({
                      title:
                        'Oletko varma että haluat poistaa selvitystilauksen?',
                      text: `Selvitystilauksen poistaminen on mahdollista vain jos 
                      selvitykseen ei ole tallennettu tiedostoja. Selvitystilauksen poistaminen on peruuttamaton toimenpide.`,
                      resolve: {
                        action: async () => {
                          await deleteOrderMutation(order.id)
                        },
                        label: 'Poista'
                      },
                      reject: {
                        action: () => setShowModal(null),
                        label: 'Peruuta'
                      }
                    })
                  }
                }}
              />
            )}
          </>
          <FlexRight style={{ height: '100%' }}>
            <Button
              text="Tallenna"
              data-qa="save-button"
              primary
              disabled={!orderInput || savingOrder || updatingOrder}
              onClick={async () => {
                if (!orderInput) return

                if (props.mode === 'CREATE') {
                  await createOrderMutation({ ...orderInput, orderId })
                } else {
                  await updateOrderMutation({ ...orderInput, orderId: id! })
                }
              }}
            />
          </FlexRight>
        </FlexLeftRight>
      </Footer>
      {showModal && (
        <InfoModal
          close={() => setShowModal(null)}
          closeLabel="Sulje"
          title={showModal.title}
          resolve={showModal.resolve}
          reject={showModal.reject}
        >
          {showModal.text}
        </InfoModal>
      )}
    </>
  )
})
