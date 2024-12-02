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
  OrderFileSuccessResponse,
  OrderFileValidationErrorResponse,
  OrderFormInput
} from 'api/order-api'
import { getDocumentTypeTitle } from 'api/report-api'
import { hasOrdererRole, UserContext } from 'auth/UserContext'
import { AxiosError } from 'axios'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'

import { NotFound } from '../../shared/404'
import {
  FlexCol,
  FlexLeftRight,
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

  // Use this to store the files that saved succesfully when creating a new order
  const [savedFileIds, setSavedFileIds] = useState<string[]>([])
  // Use this to store order id in case of order file saving error
  const [orderId, setOrderId] = useState<string | undefined>(id)

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

  const invalidateQueries = async (
    orderId: string | undefined,
    reloadOrder = true
  ) => {
    if (reloadOrder) {
      await queryClient.invalidateQueries({
        queryKey: ['order', orderId ?? id]
      })
    }
    await queryClient.invalidateQueries({
      queryKey: ['orderFiles', orderId ?? id]
    })
    await queryClient.invalidateQueries({ queryKey: ['plan-numbers'] })
    await queryClient.invalidateQueries({ queryKey: ['ordering-units'] })
  }
  const resetFormState = async (orderId: string | undefined) => {
    setOrderFileErrors([])
    await invalidateQueries(orderId)
  }

  const onCreateSuccess = useCallback(
    async ({ orderId, reportId }: { orderId: string; reportId: string }) => {
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
      await resetFormState(orderId)
    },
    []
  )

  const { mutateAsync: createOrderMutation } = useMutation({
    mutationFn: apiUpsertOrder,
    onError: (
      responses: (OrderFileSuccessResponse | OrderFileValidationErrorResponse)[]
    ) => {
      const saved = responses
        .filter((r) => r.type === 'success')
        .map((r) => r.id)

      setSavedFileIds([...new Set([...saved, ...savedFileIds])])

      const errors = responses.flatMap((r) => {
        if (r.type === 'error') {
          return [r satisfies OrderFileValidationErrorResponse]
        }
        return []
      })

      if (errors) setOrderFileErrors(errors)

      const firstOrderId = errors[0].orderId ?? undefined

      setOrderId(firstOrderId)

      const text = firstOrderId
        ? `Seuravien tiedostojen tallennus epäonnistui: ${errors
            .map((e) => `${getDocumentTypeTitle(e.documentType)}:${e.name}`)
            .join(', ')}`
        : ''

      setShowModal({
        title: 'Tilauksen luonti epäonnistui',
        text: text,
        resolve: {
          action: () => {
            setShowModal(null)
          },
          label: 'Ok'
        }
      })
    }
  })

  const onUpdateSuccess = useCallback(async () => {
    setShowModal({
      title: 'Tilaus päivitetty',
      resolve: {
        action: () => {
          setShowModal(null)
        },
        label: 'Ok'
      }
    })
    await resetFormState(orderId)
  }, [])

  const { mutateAsync: updateOrderMutation } = useMutation({
    mutationFn: apiPutOrder,
    onError: async (
      responses: (OrderFileSuccessResponse | OrderFileValidationErrorResponse)[]
    ) => {
      await invalidateQueries(id, false)

      const errors = responses.flatMap((r) => {
        if (r.type === 'error') {
          return [r satisfies OrderFileValidationErrorResponse]
        }
        return []
      })

      if (errors) setOrderFileErrors(errors)

      setShowModal({
        title: 'Tilauksen päivitys epäonnistui',
        text: `Seuravien tiedostojen tallennus epäonnistui: ${errors
          .map((e) => `${getDocumentTypeTitle(e.documentType)}:${e.name} `)
          .join(', ')}`,
        resolve: {
          action: () => {
            setShowModal(null)
          },
          label: 'Ok'
        }
      })
    }
  })

  const onDeleteSuccess = useCallback(async () => {
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
    await resetFormState(orderId)
  }, [])

  const { mutateAsync: deleteOrderMutation, isPending: deletingOrder } =
    useMutation({
      mutationFn: apiDeleteOrder,
      onSuccess: onDeleteSuccess,
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
            disabled={order?.hasApprovedReport}
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
            disabled={order?.hasApprovedReport}
          />
        )}
      </PageContainer>
      <VerticalGap $size="XL" />
      <Footer>
        <FlexLeftRight>
          <FlexCol>
            {showDeleteButton && (
              <Button
                text="Poista selvitystilaus"
                className="danger"
                data-qa="save-button"
                disabled={deletingOrder || order?.hasApprovedReport}
                onClick={() => {
                  if (order) {
                    setShowModal({
                      title:
                        'Oletko varma että haluat poistaa selvitystilauksen?',
                      text: `Selvitystilauksen poistaminen on mahdollista vain jos
                      selvitykseen ei ole tallennettu tiedostoja. Selvitystilauksen poistaminen on peruuttamaton toimenpide.`,
                      resolve: {
                        action: () => deleteOrderMutation(order.id),
                        onSuccess: onDeleteSuccess,
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
          </FlexCol>
          <FlexCol>
            {props.mode === 'CREATE' && (
              <AsyncButton
                text="Tallenna"
                data-qa="save-button"
                primary
                disabled={!orderInput || order?.hasApprovedReport}
                onSuccess={onCreateSuccess}
                onClick={() =>
                  createOrderMutation({
                    ...orderInput!,
                    orderId,
                    savedFileIds
                  })
                }
              />
            )}
            {props.mode === 'EDIT' && !!id && (
              <AsyncButton
                text="Tallenna"
                data-qa="save-button"
                primary
                disabled={!orderInput || order?.hasApprovedReport}
                onSuccess={onUpdateSuccess}
                onClick={() =>
                  updateOrderMutation({ ...orderInput!, orderId: id })
                }
              />
            )}
          </FlexCol>
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
