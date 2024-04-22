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
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { Label } from '../../shared/typography'
import { Checkbox } from 'shared/form/Checkbox'
import { FileInput, FileInputData } from 'shared/FileInput'
import {
  Order,
  OrderFile,
  OrderFileDocumentType,
  OrderFormInput,
  OrderReportDocumentInput
} from 'api/order-api'
import { ReportFileDocumentType, getDocumentTypeTitle } from 'api/report-api'
import { ExistingFile } from 'shared/form/ExistingFile'

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: OrderFormInput | null) => void
}

interface EditProps {
  mode: 'EDIT'
  order: Order
  orderFiles: OrderFile[]
  onChange: (validInput: OrderFormInput | null) => void
}
type Props = CreateProps | EditProps

const orderFileTypes = [
  OrderFileDocumentType.ORDER_INFO,
  OrderFileDocumentType.ORDER_AREA
]

interface OrderFileInputElementNew {
  type: 'NEW'
  description: string
  documentType: OrderFileDocumentType
  file: File | null
}

interface OrderFileInputElementExisting {
  type: 'EXISTING'
  documentType: OrderFileDocumentType
  orderFile: OrderFile
}

type OrderFileInputElement =
  | OrderFileInputElementNew
  | OrderFileInputElementExisting

function createFileInputs(orderFiles: OrderFile[]): OrderFileInputElement[] {
  return orderFileTypes.map((documentType) => {
    const orderFile = orderFiles.find(
      (file) => file.documentType === documentType
    )
    return orderFile
      ? { documentType, type: 'EXISTING', orderFile }
      : { documentType, type: 'NEW', description: '', file: null }
  })
}

function filesAreValid(fileInputs: OrderFileInputElement[]): boolean {
  return orderFileTypes.every((documentType) => {
    const fileInput = fileInputs.find((fi) => fi.documentType === documentType)
    return (
      fileInput?.type === 'EXISTING' ||
      (fileInput?.file && fileInput.description.trim() !== '')
    )
  })
}

export const OrderForm = React.memo(function OrderForm(props: Props) {
  const originalFileInputs = useMemo(
    () => createFileInputs(props.mode === 'EDIT' ? props.orderFiles : []),
    [props]
  )

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

  const [orderFiles, setOrderFiles] = useState<OrderFileInputElement[]>(
    createFileInputs(props.mode === 'EDIT' ? props.orderFiles : [])
  )

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

  const updateReportDocuments = (item: OrderCheckBoxComponentInput) => {
    const newArray = reportDocuments.map((row) => {
      return row.documentType === item.documentType ? item : row
    })
    setReportDocuments(newArray)
  }

  const updateOrderFiles = (modified: FileInputData<OrderFileDocumentType>) => {
    setOrderFiles(
      orderFiles.map((fi) => {
        if (fi.documentType === modified.documentType) {
          return {
            ...fi,
            description: modified.description,
            file: modified.file
          }
        }
        return fi
      })
    )
  }

  const removeCreatedFileInput = (id: string) => {
    setOrderFiles(
      orderFiles.map((fi) => {
        if (fi.type === 'EXISTING' && fi.orderFile.id === id) {
          return {
            type: 'NEW',
            file: null,
            description: '',
            documentType: fi.documentType
          }
        }
        return fi
      })
    )
  }

  const validInput: OrderFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    if (!filesAreValid(orderFiles)) return null

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
      filesToAdd: orderFiles.flatMap((e) =>
        e.type === 'NEW' && e.file !== null
          ? [
              {
                description: e.description,
                documentType: e.documentType,
                file: e.file
              }
            ]
          : []
      ),
      filesToRemove: originalFileInputs.flatMap((e) =>
        e.type === 'EXISTING' &&
        !orderFiles.find(
          (fi) => fi.type === 'EXISTING' && fi.orderFile.id === e.orderFile.id
        )
          ? [e.orderFile.id]
          : []
      )
    }
  }, [name, description, planNumber, reportDocuments, orderFiles])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props, orderFiles])

  return (
    <FlexCol>
      <SectionContainer>
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Tilauksen nimi</Label>
              <InputField onChange={setName} value={name} />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Tilauksen kuvaus</Label>
              <TextArea
                onChange={setDescription}
                value={description}
                rows={2}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Tilauksen kaavanumero</Label>

              <TextArea onChange={setPlanNumber} value={planNumber} rows={2} />
            </LabeledInput>
          </RowOfInputs>
        </GroupOfInputRows>
        <VerticalGap $size="m" />
        <GroupOfInputRows>
          <Label>Tilauksen liitteet:</Label>
          {orderFiles.map((fInput) => {
            switch (fInput.type) {
              case 'NEW':
                return (
                  <FileInput
                    key={fInput.documentType}
                    data={fInput}
                    onChange={(data) => {
                      updateOrderFiles(data)
                    }}
                  />
                )
              case 'EXISTING':
                return (
                  <ExistingFile
                    key={fInput.documentType}
                    data={{ type: 'ORDER', file: fInput.orderFile }}
                    onRemove={(id) => {
                      removeCreatedFileInput(id)
                    }}
                  />
                )
            }
          })}
        </GroupOfInputRows>
      </SectionContainer>
      <VerticalGap $size="m" />

      <SectionContainer>
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput $cols={8}>
              <Label>Kerättävät dokumentit</Label>
              {reportDocuments.map((rd) => (
                <OrderReportDocumentInput
                  key={rd.documentType}
                  data={rd}
                  onChange={updateReportDocuments}
                />
              ))}
            </LabeledInput>
          </RowOfInputs>
        </GroupOfInputRows>
      </SectionContainer>
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
