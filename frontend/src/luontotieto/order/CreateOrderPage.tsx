// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderInput, apiPostOrder } from 'api'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H1 } from '../../shared/typography'

import { OrderForm } from './OrderForm'

interface CreateProps {
  mode: 'CREATE'
}

interface EditProps {
  mode: 'EDIT'
  orderId: string
}
type Props = CreateProps | EditProps

export const CreateOrderPage = React.memo(function CreateOrderPage(
  props: Props
) {
  const navigate = useNavigate()
  const [orderInput, setOrder] = useState<OrderInput | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  return (
    <PageContainer>
      <SectionContainer>
        <H1>Tilaus</H1>
        <VerticalGap $size="m" />
        {props.mode == 'CREATE' && (
          <OrderForm mode="CREATE" onChange={setOrder} />
        )}
        <VerticalGap />
        <FlexRight>
          <Button
            text="Tallenna"
            data-qa="save-button"
            primary
            disabled={!orderInput || submitting}
            onClick={() => {
              if (!orderInput) return

              setSubmitting(true)
              apiPostOrder(orderInput)
                .then((orderId) => navigate(`/luontotieto/tilaus/${orderId}`))
                .catch(() => setSubmitting(false))
            }}
          />
        </FlexRight>
      </SectionContainer>
    </PageContainer>
  )
})
