// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Order, OrderInput } from 'api'
import React, { useEffect, useMemo } from 'react'
import { InputField } from 'shared/form/InputField'
import { TextArea } from 'shared/form/TextArea'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  FlexCol,
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  VerticalGap
} from '../../shared/layout'
import { Label } from '../../shared/typography'

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: OrderInput | null) => void
}
interface ViewProps {
  mode: 'VIEW'
  order: Order
}
interface EditProps {
  mode: 'EDIT'
  order: Order
  onChange: (validInput: OrderInput | null) => void
}
type Props = CreateProps | ViewProps | EditProps

export const OrderForm = React.memo(function OrderForm(props: Props) {
  const debounceDelay = 1500

  const [name, setName] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.name,
    debounceDelay
  )

  const [planNumber, setPlanNumber] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.name,
    debounceDelay
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.description,
    debounceDelay  )



  const validInput: OrderInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    return {
      name: name.trim(),
      description: description.trim(),
      planNumber: planNumber,
      reportDocuments: [
      ]
    }
  }, [name, description, planNumber])

  useEffect(() => {
    if (props.mode !== 'VIEW') {
      props.onChange(validInput)
    }
  }, [validInput, props])

  return (
    <FlexCol>
      <GroupOfInputRows>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Tilauksen nimi</Label>
            {props.mode === 'VIEW' ? (
              <span>{props.order.name || '-'}</span>
            ) : (
              <InputField onChange={setName} value={name} />
            )}
          </LabeledInput>
        </RowOfInputs>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Tilauksen kuvaus</Label>
            {props.mode === 'VIEW' ? (
              <span>{props.order.description || '-'}</span>
            ) : (
              <TextArea
                onChange={setDescription}
                value={description}
                rows={2}
              />
            )}
          </LabeledInput>
        </RowOfInputs>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Tilauksen kaavanumero</Label>
            {props.mode === 'VIEW' ? (
              <span>{props.order.planNumber || '-'}</span>
            ) : (
              <TextArea
                onChange={setPlanNumber}
                value={planNumber}
                rows={2}
              />
            )}
          </LabeledInput>
        </RowOfInputs>
      </GroupOfInputRows>
      <VerticalGap $size="m" />
      <VerticalGap $size="XL" />
    </FlexCol>
  )
})
