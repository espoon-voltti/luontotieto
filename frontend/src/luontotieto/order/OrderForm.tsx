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
import { H3, Label } from '../../shared/typography'
import { Checkbox } from 'shared/form/Checkbox'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { Order, OrderFile, OrderFileDocumentType, OrderFormInput, OrderReportDocumentInput } from 'api/order-api'
import { getDocumentTypeTitle, ReportFileDocumentType } from 'api/report-api'
import { ExistingFile } from 'shared/form/File/ExistingFile'
import { TagAutoComplete } from 'shared/form/TagAutoComplete/TagAutoComplete'
import { Tag } from 'react-tag-autocomplete'
import { useGetAssigneeUsersQuery } from '../../api/hooks/users'
import { User } from '../../api/users-api'
import { Select } from '../../shared/form/Select'

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: OrderFormInput | null) => void
  planNumbers: string[]
}

interface EditProps {
  mode: 'EDIT'
  order: Order
  orderFiles: OrderFile[]
  onChange: (validInput: OrderFormInput | null) => void
  planNumbers: string[]
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
      documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET
    },
    {
      checked: false,
      documentType: ReportFileDocumentType.LIITO_ORAVA_ALUEET
    }
  ]

  const [name, setName] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.name
  )

  const [planNumbers, setPlanNumbers] = useDebouncedState(
    props.mode === 'CREATE' ? [] : props.order.planNumber ?? []
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

  const updatePlanNumbers = (selected: Tag[]) => {
    setPlanNumbers(selected.map((s) => s.label))
  }

  const {data: assigneeUsers} = useGetAssigneeUsersQuery()
  const [assignee, setAssignee] = useState<User | undefined>()

  useEffect(() => {
    if (props.mode === 'EDIT') {
      const assignee = assigneeUsers?.find((u) => u?.id === props.order.assigneeId)
      setAssignee(assignee)
    }
  }, [assigneeUsers, props])

  const validInput: OrderFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    if (!filesAreValid(orderFiles)) return null
    if (!assignee) return null

    return {
      name: name.trim(),
      description: description.trim(),
      planNumber: planNumbers,
      reportDocuments: reportDocuments
        .filter((rd) => rd.checked)
        .map((rd) => ({
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
      ),
      assigneeId: assignee.id
    }
  }, [name, description, planNumbers, reportDocuments, orderFiles, assignee])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props, orderFiles])

  const uniquePlanNumbers = [...new Set([...planNumbers, ...props.planNumbers])]
  const suggestions = uniquePlanNumbers.map((pn) => ({
    value: pn,
    label: pn
  }))

  return (
    <FlexCol>
      <SectionContainer $sidePadding="62px">
        <H3>Tilauksen tiedot</H3>
        <VerticalGap $size="L" />
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
              <Label>Tilaukseen liittyvät maankäytön suunnitelmat</Label>
              <TagAutoComplete
                suggestions={suggestions}
                data={
                  planNumbers?.map((pn) => ({
                    value: pn,
                    label: pn
                  })) ?? []
                }
                onChange={updatePlanNumbers}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Selvityksen tekijä</Label>
              <Select
                selectedItem={assignee}
                items={assigneeUsers ?? []}
                onChange={setAssignee}
                getItemLabel={(u) => u?.name ?? '-'}
                getItemValue={(u) => u?.id ?? '-'}
              ></Select>
            </LabeledInput>
          </RowOfInputs>
        </GroupOfInputRows>
        <VerticalGap $size="L" />
        <GroupOfInputRows>
          <Label>Tilauksen liitteet</Label>

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
                    data={{
                      type: 'ORDER',
                      file: fInput.orderFile,
                      readonly: false,
                      documentType: fInput.documentType
                    }}
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

      <SectionContainer $sidePadding="62px">
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput $cols={8}>
              <Label>Kerättävät dokumentit</Label>
              <VerticalGap $size="s" />

              {reportDocuments.map((rd) => (
                <Checkbox
                  label={getDocumentTypeTitle(rd.documentType)}
                  checked={rd.checked}
                  onChange={(checked) =>
                    updateReportDocuments({
                      checked,
                      documentType: rd.documentType
                    })
                  }
                ></Checkbox>
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
