// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Order, OrderInput,  OrderReportDocumentInput, ReportFileDocumentType, getDocumentTypeTitle } from 'api'
import React, { useEffect, useMemo, useState } from 'react'
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
import { Checkbox } from 'shared/form/Checkbox'

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
  const defaultReportDocuments = [
    {checked: false, description: "", documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET },
    {checked: false, description: "", documentType: ReportFileDocumentType.LIITO_ORAVA_ALUEET}
  ]

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

  
  const [reportDocuments, setReportDocuments] = useState(props.mode === 'CREATE' ? defaultReportDocuments : 
  defaultReportDocuments.map((rd) => {
    const orderReportDocument = props.order.reportDocuments.find((row) => row.documentType === rd.documentType)
    if(!orderReportDocument){
      return rd
    }else {
      return {...orderReportDocument, checked: true}
    }
  })
  )

  const updateArray = (item: OrderCheckBoxComponentInput) => {
    const newArray = reportDocuments.map((row) => {
      return row.documentType === item.documentType ? item : row
    })
    setReportDocuments(newArray)
  }
  



  const validInput: OrderInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    return {
      name: name.trim(),
      description: description.trim(),
      planNumber: planNumber,
      reportDocuments: reportDocuments.filter((rd) => rd.checked).map((rd) => ({description: rd.description, documentType: rd.documentType}))
    }
  }, [name, description, planNumber, reportDocuments])

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
      <GroupOfInputRows>
        <RowOfInputs>
        <LabeledInput $cols={8}>
        <Label>Kerättävät dokumentit</Label>
        <OrderReportDocumentInput data={{checked: false, description: "", documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET}}
          onChange={updateArray}/>
          <OrderReportDocumentInput data={{checked: false, description: "", documentType: ReportFileDocumentType.LIITO_ORAVA_ALUEET}}
          onChange={updateArray}/>
      </LabeledInput>

        </RowOfInputs>
      </GroupOfInputRows>
      <VerticalGap $size="m" />
      <VerticalGap $size="XL" />
    </FlexCol>
  )
})


interface OrderCheckBoxComponentInput extends OrderReportDocumentInput {
  checked: boolean
}

interface OrderReportDocumentInputProps {
  data: OrderCheckBoxComponentInput
  onChange: (data: OrderCheckBoxComponentInput) => void
}


const OrderReportDocumentInput = React.memo(function OrderReportDocumentInput({
  data, onChange
}: OrderReportDocumentInputProps) {
  const debounceDelay = 1500

  const [checked, setChecked] = useState(data.checked ?? false)
  const [description, setDescription] = useDebouncedState(
     data.description,
    debounceDelay)

    useEffect(() => {
        onChange({checked, description, documentType: data.documentType})
    }, [checked, description])

  return (
    <RowOfInputs>
          <Checkbox label={getDocumentTypeTitle(data.documentType)} checked={checked} onChange={setChecked}></Checkbox>
            <InputField
              onChange={(value) => {
                setDescription(value)
              }}
              value={description}
            />
    </RowOfInputs>
  )
})
