// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import {
  Order,
  OrderFile,
  OrderFileDocumentType,
  OrderFormInput,
  OrderReportDocumentInput
} from 'api/order-api'
import { getDocumentTypeTitle, ReportFileDocumentType } from 'api/report-api'
import { emailRegex } from 'luontotieto/user-management/common'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Tag } from 'react-tag-autocomplete'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Checkbox } from 'shared/form/Checkbox'
import { ExistingFile } from 'shared/form/File/ExistingFile'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { InputField } from 'shared/form/InputField'
import { TagAutoComplete } from 'shared/form/TagAutoComplete/TagAutoComplete'
import { TextArea } from 'shared/form/TextArea'
import { useDebouncedState } from 'shared/useDebouncedState'
import { v4 as uuidv4 } from 'uuid'

import { useGetAssigneeUsersQuery } from '../../api/hooks/users'
import { User } from '../../api/users-api'
import { DATE_PATTERN } from '../../shared/dates'
import { Select } from '../../shared/form/Select'
import {
  FlexCol,
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H3, Label } from '../../shared/typography'

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
  OrderFileDocumentType.ORDER_AREA,
  OrderFileDocumentType.ORDER_INFO
]

interface OrderFileInputElementNew {
  type: 'NEW'
  description: string
  documentType: OrderFileDocumentType
  file: File | null
  id: string
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
  if (orderFiles.length > 0) {
    return orderFiles.map((orderFile) => ({
      documentType: orderFile.documentType,
      type: 'EXISTING',
      orderFile
    }))
  }

  return orderFileTypes.map((documentType) => {
    const orderFile = orderFiles.find(
      (file) => file.documentType === documentType
    )
    return orderFile
      ? { documentType, type: 'EXISTING', orderFile }
      : { documentType, type: 'NEW', description: '', file: null, id: uuidv4() }
  })
}

function filesAreValid(fileInputs: OrderFileInputElement[]): boolean {
  return orderFileTypes.every((documentType) =>
    fileInputs.some(
      (fileInput) =>
        fileInput.documentType === documentType &&
        (fileInput?.type === 'EXISTING' ||
          (fileInput?.file && fileInput.description.trim() !== ''))
    )
  )
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

  const [returnDate, setReturnDate] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.returnDate
  )

  const [planNumbers, setPlanNumbers] = useDebouncedState(
    props.mode === 'CREATE' ? [] : props.order.planNumber ?? []
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.description
  )

  const [contactPerson, setContactPerson] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.contactPerson
  )

  const [contactEmail, setContactEmail] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.contactEmail
  )

  const invalidContactEmailInfo = useMemo(
    () =>
      contactEmail && !contactEmail.match(emailRegex)
        ? {
            text: 'Syötä oikeaa muotoa oleva sähköposti',
            status: 'warning' as const
          }
        : undefined,
    [contactEmail]
  )

  const [contactPhone, setContactPhone] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.contactPhone
  )

  const [assigneeContactPerson, setAssigneeContactPerson] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.assigneeContactPerson
  )

  const [assigneeContactEmail, setAssigneeContactEmail] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.order.assigneeContactEmail
  )

  const invalidAssigneeContactEmailInfo = useMemo(
    () =>
      assigneeContactEmail && !assigneeContactEmail.match(emailRegex)
        ? {
            text: 'Syötä oikeaa muotoa oleva sähköposti',
            status: 'warning' as const
          }
        : undefined,
    [assigneeContactEmail]
  )

  const [orderFiles, setOrderFiles] = useState<OrderFileInputElement[]>(
    createFileInputs(props.mode === 'EDIT' ? props.orderFiles : [])
  )

  const orderAreaFile = useMemo(
    () =>
      orderFiles.find(
        (f) => f.documentType === OrderFileDocumentType.ORDER_AREA
      ),
    [orderFiles]
  )

  const orderInfoFiles = useMemo(
    () =>
      orderFiles.filter(
        (f) => f.documentType === OrderFileDocumentType.ORDER_INFO
      ),
    [orderFiles]
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
    const newArray = reportDocuments.map((row) =>
      row.documentType === item.documentType ? item : row
    )
    setReportDocuments(newArray)
  }

  const removeCreatedFileInput = (id: string) => {
    setOrderFiles(
      orderFiles.map((fi) => {
        if (fi.type === 'EXISTING' && fi.orderFile.id === id) {
          return {
            type: 'NEW',
            file: null,
            description: '',
            documentType: fi.documentType,
            id: uuidv4()
          }
        }
        return fi
      })
    )
  }

  const updateOrderFiles = useCallback(
    (
      modified: FileInputData & {
        documentType: OrderFileDocumentType
      }
    ) => {
      setOrderFiles(
        orderFiles.map((fi) => {
          if (fi.type === 'NEW' && fi.id === modified.id) {
            return {
              ...fi,
              description: modified.description,
              file: modified.file
            }
          }
          return fi
        })
      )
    },
    [setOrderFiles, orderFiles]
  )

  const updatePlanNumbers = useCallback(
    (selected: Tag[]) => {
      setPlanNumbers(selected.map((s) => s.label))
    },
    [setPlanNumbers]
  )

  const { data: assigneeUsers } = useGetAssigneeUsersQuery()
  const [assignee, setAssignee] = useState<User | undefined>()

  useEffect(() => {
    if (props.mode === 'EDIT') {
      const assignee = assigneeUsers?.find(
        (u) => u?.id === props.order.assigneeId
      )
      setAssignee(assignee)
    }
  }, [assigneeUsers, props])

  const validInput: OrderFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null
    if (!filesAreValid(orderFiles)) return null
    if (!assignee) return null
    if (!returnDate.trim().match(DATE_PATTERN)) return null
    if (contactPerson.trim() === '') return null
    if (contactPhone.trim() === '') return null
    if (!contactEmail.trim().match(emailRegex)) return null
    if (assigneeContactPerson.trim() === '') return null
    if (!assigneeContactEmail.trim().match(emailRegex)) return null

    return {
      name: name.trim(),
      description: description.trim(),
      planNumber: planNumbers,
      reportDocuments: reportDocuments
        .filter((rd) => rd.checked)
        .map((rd) => ({
          documentType: rd.documentType
        })),
      returnDate: returnDate,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
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
      assigneeId: assignee.id,
      assigneeContactPerson: assigneeContactPerson.trim(),
      assigneeContactEmail: assigneeContactEmail.trim()
    }
  }, [
    name,
    description,
    planNumbers,
    reportDocuments,
    orderFiles,
    assignee,
    originalFileInputs,
    returnDate,
    contactPerson,
    contactPhone,
    contactEmail,
    assigneeContactPerson,
    assigneeContactEmail
  ])

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
      <SectionContainer>
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
              <Label>Selvitys palautettava viimeistään</Label>
              <InputField
                width="m"
                onChange={setReturnDate}
                value={returnDate}
                type="date"
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={10}>
              <Label>Selvityksen kuvaus</Label>
              <TextArea
                onChange={setDescription}
                value={description}
                rows={2}
              />
            </LabeledInput>
          </RowOfInputs>
          <H3>Tilaajan tiedot</H3>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilö</Label>
              <InputField onChange={setContactPerson} value={contactPerson} />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön sähköposti</Label>
              <InputField
                onChange={setContactEmail}
                value={contactEmail}
                info={invalidContactEmailInfo}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön puhelinnumero</Label>
              <InputField onChange={setContactPhone} value={contactPhone} />
            </LabeledInput>
          </RowOfInputs>
          <H3>Selvityksen tekijä</H3>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Selvityksen tekijä</Label>
              <Select
                selectedItem={assignee}
                items={assigneeUsers ?? []}
                onChange={setAssignee}
                getItemLabel={(u) => u?.name ?? '-'}
                getItemValue={(u) => u?.id ?? '-'}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilö</Label>
              <InputField
                onChange={setAssigneeContactPerson}
                value={assigneeContactPerson}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön sähköposti</Label>
              <InputField
                onChange={setAssigneeContactEmail}
                value={assigneeContactEmail}
                info={invalidAssigneeContactEmailInfo}
              />
            </LabeledInput>
          </RowOfInputs>
        </GroupOfInputRows>
        <VerticalGap $size="L" />
        <H3>Tilauksen liitteet</H3>
        <VerticalGap $size="L" />
        <GroupOfInputRows>
          {orderAreaFile && orderAreaFile.type === 'NEW' && (
            <FileInput
              documentType={orderAreaFile.documentType}
              key={orderAreaFile.id}
              data={orderAreaFile}
              onChange={(data) => {
                updateOrderFiles({
                  ...data,
                  documentType: orderAreaFile.documentType
                })
              }}
            />
          )}
          {orderAreaFile && orderAreaFile.type === 'EXISTING' && (
            <ExistingFile
              key={orderAreaFile.orderFile.id}
              data={{
                type: 'ORDER',
                file: orderAreaFile.orderFile,
                readonly: false,
                documentType: orderAreaFile.documentType,
                updated: orderAreaFile.orderFile.updated
              }}
              onRemove={(id) => {
                removeCreatedFileInput(id)
              }}
            />
          )}
        </GroupOfInputRows>
        <VerticalGap $size="L" />
        <GroupOfInputRows>
          {orderInfoFiles.map((fInput, idx) => {
            switch (fInput.type) {
              case 'NEW':
                return (
                  <FileInput
                    documentType={fInput.documentType}
                    key={fInput.id}
                    data={fInput}
                    showTitle={idx === 0}
                    onChange={(data) => {
                      updateOrderFiles({
                        ...data,
                        documentType: fInput.documentType
                      })
                    }}
                  />
                )
              case 'EXISTING':
                return (
                  <ExistingFile
                    key={fInput.orderFile.id}
                    showTitle={idx === 0}
                    data={{
                      type: 'ORDER',
                      file: fInput.orderFile,
                      readonly: false,
                      documentType: fInput.documentType,
                      updated: fInput.orderFile.updated
                    }}
                    onRemove={(id) => {
                      removeCreatedFileInput(id)
                    }}
                  />
                )
            }
          })}
        </GroupOfInputRows>
        <VerticalGap $size="L" />
        <InlineButton
          text="Lisää liite"
          icon={faPlus}
          onClick={() =>
            setOrderFiles([
              ...orderFiles,
              {
                id: uuidv4(),
                documentType: OrderFileDocumentType.ORDER_INFO,
                type: 'NEW',
                description: '',
                file: null
              }
            ])
          }
        />
      </SectionContainer>
      <VerticalGap $size="m" />
      <SectionContainer>
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput $cols={8}>
              <Label>Kerättävät dokumentit</Label>
              <VerticalGap $size="s" />

              {reportDocuments.map((rd, index) => (
                <Checkbox
                  key={index}
                  label={getDocumentTypeTitle(rd.documentType)}
                  checked={rd.checked}
                  onChange={(checked) =>
                    updateReportDocuments({
                      checked,
                      documentType: rd.documentType
                    })
                  }
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
