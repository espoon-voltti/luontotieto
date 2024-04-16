// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

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
import { FileInput, FileInputData } from 'shared/FileInput'
import {
  Order,
  OrderFileDocumentType,
  OrderInput,
  OrderReportDocumentInput
} from 'api/order-api'
import { ReportFileDocumentType, getDocumentTypeTitle } from 'api/report-api'

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
  const defaultReportDocuments = [
    {
      checked: false,
      description: '',
      documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET
    },
    {
      checked: false,
      description: '',
      documentType: ReportFileDocumentType.LIITO_ORAVA_ALUEET
    }
  ]

  const [name, setName] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.name
  )

  const [planNumber, setPlanNumber] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.name
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.description
  )

  const [orderInfoFile, setOrderInfoFile] = useState<
    FileInputData<OrderFileDocumentType>
  >({
    file: null,
    description: '',
    documentType: OrderFileDocumentType.ORDER_INFO
  })
  const [orderAreaFile, sertOrderAreaFile] = useState<
    FileInputData<OrderFileDocumentType>
  >({
    file: null,
    description: '',
    documentType: OrderFileDocumentType.ORDER_AREA
  })

  const [reportDocuments, setReportDocuments] = useState(
    props.mode === 'CREATE'
      ? defaultReportDocuments
      : defaultReportDocuments.map((rd) => {
          const orderReportDocument = props.order.reportDocuments.find(
            (row) => row.documentType === rd.documentType
          )
          if (!orderReportDocument) {
            return rd
          } else {
            return { ...orderReportDocument, checked: true }
          }
        })
  )

  const updateArray = (item: OrderCheckBoxComponentInput) => {
    const newArray = reportDocuments.map((row) => {
      return row.documentType === item.documentType ? item : row
    })
    setReportDocuments(newArray)
  }

  const validOrderFile = (file: FileInputData<OrderFileDocumentType>) => {
    if (file.file === null) return null
    if (file.description.trim() === '') return null
    return { ...file, file: file.file }
  }

  const validInput: OrderInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    const orderFile = validOrderFile(orderInfoFile)
    const areaFile = validOrderFile(orderAreaFile)
    if (!orderFile) return null
    if (!areaFile) return null

    return {
      name: name.trim(),
      description: description.trim(),
      planNumber: planNumber,
      reportDocuments: reportDocuments
        .filter((rd) => rd.checked)
        .map((rd) => ({
          description: rd.description,
          documentType: rd.documentType
        })),
      files: [orderFile, areaFile]
    }
  }, [
    name,
    description,
    planNumber,
    reportDocuments,
    orderInfoFile,
    orderAreaFile
  ])

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
              <TextArea onChange={setPlanNumber} value={planNumber} rows={2} />
            )}
          </LabeledInput>
        </RowOfInputs>
      </GroupOfInputRows>
      <VerticalGap $size="m" />
      <GroupOfInputRows>
        <FileInput
          data={orderInfoFile}
          onChange={(data) => setOrderInfoFile(data)}
        />
        <FileInput
          data={orderAreaFile}
          onChange={(data) => sertOrderAreaFile(data)}
        />
      </GroupOfInputRows>
      <GroupOfInputRows>
        <RowOfInputs>
          <LabeledInput $cols={8}>
            <Label>Kerättävät dokumentit</Label>
            {reportDocuments.map((rd) => (
              <OrderReportDocumentInput
                key={rd.documentType}
                data={rd}
                onChange={updateArray}
              />
            ))}
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
  data,
  onChange
}: OrderReportDocumentInputProps) {
  const [checked, setChecked] = useState(data.checked ?? false)
  const [description, setDescription] = useDebouncedState(data.description)

  useEffect(() => {
    onChange({ checked, description, documentType: data.documentType })
  }, [checked, description])

  return (
    <RowOfInputs>
      <Checkbox
        label={getDocumentTypeTitle(data.documentType)}
        checked={checked}
        onChange={setChecked}
      ></Checkbox>
      <InputField
        onChange={(value) => {
          setDescription(value)
        }}
        value={description}
      />
    </RowOfInputs>
  )
})
