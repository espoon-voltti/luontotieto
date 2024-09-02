// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import {
  Order,
  OrderFile,
  OrderFileDocumentType,
  OrderFileValidationErrorResponse,
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
  orderingUnits: string[]
  errors: OrderFileValidationErrorResponse[]
  disabled?: boolean
}

interface EditProps {
  mode: 'EDIT'
  order: Order
  orderFiles: OrderFile[]
  onChange: (validInput: OrderFormInput | null) => void
  planNumbers: string[]
  orderingUnits: string[]
  errors: OrderFileValidationErrorResponse[]
  disabled?: boolean
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
  const files: OrderFileInputElement[] = orderFileTypes.map((documentType) => {
    const orderFile = orderFiles.find(
      (file) => file.documentType === documentType
    )
    return orderFile
      ? {
          documentType,
          type: 'EXISTING',
          orderFile
        }
      : {
          documentType,
          type: 'NEW',
          description: '',
          file: null,
          id: uuidv4()
        }
  })

  const additionalFiles = orderFiles
    .filter(
      (file) =>
        !files.some((f) => f.type === 'EXISTING' && f.orderFile.id === file.id)
    )
    .map(
      (orderFile) =>
        ({
          documentType: orderFile.documentType,
          type: 'EXISTING',
          orderFile
        }) as OrderFileInputElementExisting
    )

  return [...files, ...additionalFiles]
}

function filesAreValid(fileInputs: OrderFileInputElement[]): boolean {
  return orderFileTypes.every((documentType) =>
    fileInputs.some(
      (fileInput) =>
        fileInput.documentType === documentType &&
        (fileInput?.type === 'EXISTING' || fileInput?.file)
    )
  )
}

const defaultReportDocuments = [
  {
    checked: false,
    documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LIITO_ORAVA_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LIITO_ORAVA_VIIVAT
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LEPAKKO_VIIVAT
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LEPAKKO_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LUMO_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.NORO_VIIVAT
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LUONTOTYYPIT_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.EKOYHTEYDET_ALUEET
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.EKOYHTEYDET_VIIVAT
  },
  {
    checked: false,
    documentType: ReportFileDocumentType.LAHTEET_PISTEET
  }
]

function createOrderFormInput(order: Order | undefined): OrderFormInput {
  return {
    name: order?.name ?? '',
    description: order?.description ?? '',
    returnDate: order?.returnDate ?? '',
    assigneeId: order?.assigneeId ?? '',
    assigneeContactEmail: order?.assigneeContactEmail ?? '',
    assigneeContactPerson: order?.assigneeContactPerson ?? '',
    contactPhone: order?.contactPhone ?? '',
    contactPerson: order?.contactPerson ?? '',
    contactEmail: order?.contactEmail ?? '',
    filesToAdd: [],
    filesToRemove: [],
    reportDocuments: []
  }
}

export const OrderForm = React.memo(function OrderForm(props: Props) {
  const originalFileInputs = useMemo(
    () => createFileInputs(props.mode === 'EDIT' ? props.orderFiles : []),
    [props]
  )

  const [orderInput, setOrderInput] = useDebouncedState<OrderFormInput>(
    createOrderFormInput(props.mode === 'EDIT' ? props?.order : undefined)
  )

  const [planNumbers, setPlanNumbers] = useDebouncedState(
    props.mode === 'CREATE' ? [] : props.order.planNumber ?? []
  )

  const [orderingUnit, setorderingUnit] = useDebouncedState(
    props.mode === 'CREATE' ? [] : props.order.orderingUnit ?? []
  )

  const invalidContactEmailInfo = useMemo(
    () =>
      orderInput.contactEmail && !orderInput.contactEmail.match(emailRegex)
        ? {
            text: 'Syötä oikeaa muotoa oleva sähköposti',
            status: 'warning' as const
          }
        : undefined,
    [orderInput.contactEmail]
  )

  const invalidAssigneeContactEmailInfo = useMemo(
    () =>
      orderInput.assigneeContactEmail &&
      !orderInput.assigneeContactEmail.match(emailRegex)
        ? {
            text: 'Syötä oikeaa muotoa oleva sähköposti',
            status: 'warning' as const
          }
        : undefined,
    [orderInput.assigneeContactEmail]
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

  const updateOrderingUnits = useCallback(
    (selected: Tag[]) => {
      setorderingUnit(selected.map((s) => s.label))
    },
    [setorderingUnit]
  )

  const { data: assigneeUsers } = useGetAssigneeUsersQuery()

  const assignee = useMemo(
    () => assigneeUsers?.find((u) => u?.id === orderInput.assigneeId),
    [orderInput, assigneeUsers]
  )

  const validInput: OrderFormInput | null = useMemo(() => {
    if (orderInput.name.trim() === '') return null
    if (orderInput.description.trim() === '') return null
    if (!filesAreValid(orderFiles)) return null
    if (!assignee) return null
    if (!orderInput.returnDate.trim().match(DATE_PATTERN)) return null
    if (orderInput.contactPerson.trim() === '') return null
    if (orderInput.contactPhone.trim() === '') return null
    if (!orderInput.contactEmail.trim().match(emailRegex)) return null
    if (orderInput.assigneeContactPerson.trim() === '') return null
    if (!orderInput.assigneeContactEmail.trim().match(emailRegex)) return null
    return {
      name: orderInput.name.trim(),
      description: orderInput.description.trim(),
      returnDate: orderInput.returnDate,
      contactEmail: orderInput.contactEmail.trim(),
      contactPhone: orderInput.contactPhone.trim(),
      contactPerson: orderInput.contactPerson.trim(),
      assigneeContactEmail: orderInput.assigneeContactEmail.trim(),
      assigneeContactPerson: orderInput.assigneeContactPerson.trim(),
      planNumber: planNumbers,
      orderingUnit: orderingUnit,
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
                file: e.file,
                id: e.id,
                name: e.file.name
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
  }, [
    orderInput,
    planNumbers,
    orderingUnit,
    reportDocuments,
    orderFiles,
    assignee,
    originalFileInputs
  ])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props, orderFiles])

  const uniquePlanNumbers = [...new Set([...planNumbers, ...props.planNumbers])]
  const planNumberSuggestions = uniquePlanNumbers.map((pn) => ({
    value: pn,
    label: pn
  }))

  const uniqueOrderingUnits = [
    ...new Set([...orderingUnit, ...props.orderingUnits])
  ]
  const orderingUnitSuggestions = uniqueOrderingUnits.map((pn) => ({
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
              <Label>Tilauksen nimi *</Label>
              <TextArea
                onChange={(name) => setOrderInput({ ...orderInput, name })}
                value={orderInput.name}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Tilaajan yksikkö</Label>
              <TagAutoComplete
                suggestions={orderingUnitSuggestions}
                data={
                  orderingUnit?.map((pn) => ({
                    value: pn,
                    label: pn
                  })) ?? []
                }
                onChange={updateOrderingUnits}
                placeholderText="Etsi tai lisää yksikkö"
                disabled={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Tilaukseen liittyvät maankäytön suunnitelmat</Label>
              <TagAutoComplete
                suggestions={planNumberSuggestions}
                data={
                  planNumbers?.map((pn) => ({
                    value: pn,
                    label: pn
                  })) ?? []
                }
                onChange={updatePlanNumbers}
                placeholderText="Etsi tai lisää kaava"
                disabled={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Selvitys palautettava viimeistään *</Label>
              <InputField
                width="m"
                onChange={(returnDate) =>
                  setOrderInput({ ...orderInput, returnDate })
                }
                value={orderInput.returnDate}
                type="date"
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={10}>
              <Label>Selvityksen kuvaus *</Label>
              <TextArea
                onChange={(description) =>
                  setOrderInput({
                    ...orderInput,
                    description
                  })
                }
                value={orderInput.description}
                rows={2}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <H3>Tilaajan tiedot</H3>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilö *</Label>
              <InputField
                onChange={(contactPerson) =>
                  setOrderInput({
                    ...orderInput,
                    contactPerson
                  })
                }
                value={orderInput.contactPerson}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön sähköposti *</Label>
              <InputField
                onChange={(contactEmail) =>
                  setOrderInput({
                    ...orderInput,
                    contactEmail
                  })
                }
                value={orderInput.contactEmail}
                info={invalidContactEmailInfo}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön puhelinnumero *</Label>
              <InputField
                onChange={(contactPhone) =>
                  setOrderInput({
                    ...orderInput,
                    contactPhone
                  })
                }
                value={orderInput.contactPhone}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <H3>Selvityksen tekijä</H3>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Selvityksen tekijä *</Label>
              <Select
                selectedItem={assignee}
                items={assigneeUsers ?? []}
                onChange={(assignee) =>
                  setOrderInput({
                    ...orderInput,
                    assigneeId: assignee?.id ?? ''
                  })
                }
                getItemLabel={(u) => u?.name ?? '-'}
                getItemValue={(u) => u?.id ?? '-'}
                disabled={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilö *</Label>
              <InputField
                onChange={(assigneeContactPerson) =>
                  setOrderInput({
                    ...orderInput,
                    assigneeContactPerson
                  })
                }
                value={orderInput.assigneeContactPerson}
                readonly={props.disabled}
              />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={4}>
              <Label>Yhteyshenkilön sähköposti *</Label>
              <InputField
                onChange={(assigneeContactEmail) =>
                  setOrderInput({
                    ...orderInput,
                    assigneeContactEmail
                  })
                }
                value={orderInput.assigneeContactEmail}
                info={invalidAssigneeContactEmailInfo}
                readonly={props.disabled}
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
              errors={
                props.errors.find((error) => error.id === orderAreaFile.id)
                  ?.errors
              }
              accept=".gpkg"
              required={true}
              readOnly={props.disabled}
            />
          )}
          {orderAreaFile && orderAreaFile.type === 'EXISTING' && (
            <ExistingFile
              key={orderAreaFile.orderFile.id}
              data={{
                type: 'ORDER',
                file: orderAreaFile.orderFile,
                readonly: props.disabled ?? false,
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
                    errors={
                      props.errors.find((error) => error.id === fInput.id)
                        ?.errors
                    }
                    readOnly={props.disabled}
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
                      readonly: props.disabled ?? false,
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
          disabled={props.disabled}
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
                  disabled={props.disabled}
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
