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
import { UserRole } from 'api/users-api'
import { UserContext } from 'auth/UserContext'
import { emailRegex } from 'luontotieto/user-management/common'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Tag } from 'react-tag-autocomplete'
import { InfoBox } from 'shared/MessageBoxes'
import { InfoButton } from 'shared/buttons/InfoButton'
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
  FlexRow,
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H3, Label, P } from '../../shared/typography'

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
  focus?: boolean
}

interface OrderFileInputElementExisting {
  type: 'EXISTING'
  documentType: OrderFileDocumentType
  orderFile: OrderFile
}

type OrderFileInputElement =
  | OrderFileInputElementNew
  | OrderFileInputElementExisting

function createExistingFileInputs(
  orderFiles: OrderFile[]
): OrderFileInputElementExisting[] {
  return orderFiles.map((of) => ({
    documentType: of.documentType,
    type: 'EXISTING',
    orderFile: of
  }))
}

function createFileInputs(
  orderFiles: OrderFile[],
  inMemoryFiles: OrderFileInputElement[]
): OrderFileInputElement[] {
  const requiredFiles: OrderFileInputElement[] = orderFileTypes.map(
    (documentType) => {
      const existingFile = orderFiles.find(
        (file) => file.documentType === documentType
      )
      const existingInMemoryFile = inMemoryFiles.find(
        (i) => documentType === i.documentType
      )
      if (existingFile) {
        return {
          documentType,
          type: 'EXISTING',
          orderFile: existingFile
        }
      }
      if (existingInMemoryFile) {
        return existingInMemoryFile
      }
      // If none of these are found return new
      return {
        documentType,
        type: 'NEW',
        description: '',
        file: null,
        id: uuidv4()
      }
    }
  )
  if (inMemoryFiles.length === 0) {
    return requiredFiles
  }

  const requiredFileIds = requiredFiles.map((rf) =>
    rf.type === 'NEW' ? rf.id : rf.orderFile.id
  )

  // This is the order we want to hold for the additional in memory files
  const inMemoryAdditionalFileIds = inMemoryFiles
    .map((imf) => (imf.type === 'NEW' ? imf.id : imf.orderFile.id))
    .filter((id) => !requiredFileIds.some((rfId) => rfId === id))

  const existingAdditionalFileIds = orderFiles
    .filter(
      (file) =>
        !requiredFiles.some(
          (f) => f.type === 'EXISTING' && f.orderFile.id === file.id
        )
    )
    .map((orderFile) => orderFile.id)

  const additionalFileIds = [
    ...new Set([...inMemoryAdditionalFileIds, ...existingAdditionalFileIds])
  ]

  const additionalFiles: (OrderFileInputElement | null)[] =
    additionalFileIds.map((fileId) => {
      const existingFile = orderFiles.find((of) => of.id === fileId)
      if (existingFile) {
        return {
          documentType: existingFile.documentType,
          type: 'EXISTING',
          orderFile: existingFile
        }
      }
      const inMemoryFile = inMemoryFiles.find(
        (imf) => imf.type === 'NEW' && imf.id === fileId
      )
      if (inMemoryFile && inMemoryFile.type === 'NEW') {
        return inMemoryFile
      }
      return null
    })

  return [
    ...requiredFiles,
    ...additionalFiles.flatMap((af) => (af !== null ? [af] : []))
  ]
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
    assigneeCompanyName: order?.assigneeCompanyName ?? '',
    contactPhone: order?.contactPhone ?? '',
    contactPerson: order?.contactPerson ?? '',
    contactEmail: order?.contactEmail ?? '',
    filesToAdd: [],
    filesToRemove: [],
    reportDocuments: []
  }
}

export const OrderForm = React.memo(function OrderForm(props: Props) {
  const { user } = useContext(UserContext)

  const originalFileInputs = useMemo(
    () =>
      createExistingFileInputs(props.mode === 'EDIT' ? props.orderFiles : []),
    [props]
  )

  const [
    showOrderAssigneeCompanyNameInfo,
    setShowOrderAssigneeCompanyNameInfo
  ] = useState(false)

  const [showPlanNumberSuggestionsInfo, setShowPlanNumberSuggestionsInfo] =
    useState(false)

  const [showCollectedDocumentsInfo, setShowCollectedDocumentsInfo] =
    useState(false)

  const [orderFiles, setOrderFiles] = useState<OrderFileInputElement[]>(
    createFileInputs(props.mode === 'EDIT' ? props.orderFiles : [], [])
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
      assigneeCompanyName:
        orderInput.assigneeCompanyName?.trim() === ''
          ? null
          : orderInput.assigneeCompanyName?.trim() ?? null,
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

  useEffect(() => {
    setOrderFiles(
      createFileInputs(
        props.mode === 'EDIT' ? props.orderFiles : [],
        orderFiles
      )
    )
  }, [originalFileInputs])

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

  const showOrderAssigneeCompanyName =
    props.mode === 'CREATE' ? user?.role === UserRole.ADMIN : true

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
              <FlexRow>
                <Label>Tilaukseen liittyvät maankäytön suunnitelmat</Label>
                <InfoButton
                  onClick={() =>
                    setShowPlanNumberSuggestionsInfo(
                      !showPlanNumberSuggestionsInfo
                    )
                  }
                />
              </FlexRow>
              {showPlanNumberSuggestionsInfo && (
                <InfoBox
                  message={
                    <P>
                      Jos luontoselvityksen tilaaminen liittyy kaavaan tai
                      muuhun maankäytön hankkeeseen tai suunnitelmaan, ne
                      kannattaa kirjoittaa tähän. Jos mitään maankäytön
                      suunnitelmia ei ole, kentän voi jättää tyhjäksi.
                    </P>
                  }
                />
              )}
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
                aria-describedby="date-picker-input"
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
          {showOrderAssigneeCompanyName && (
            <RowOfInputs>
              <LabeledInput $cols={4}>
                <FlexRow>
                  <Label>Yhteysyritys </Label>
                  <InfoButton
                    onClick={() =>
                      setShowOrderAssigneeCompanyNameInfo(
                        !showOrderAssigneeCompanyNameInfo
                      )
                    }
                  />
                </FlexRow>
                {showOrderAssigneeCompanyNameInfo && (
                  <InfoBox
                    message={
                      <P>
                        Tällä kentällä pääkäyttäjä voi ylikirjoittaa
                        aluerajaukseen tallentuvan selvittäjän nimen.
                      </P>
                    }
                  />
                )}
                <InputField
                  onChange={(assigneeCompanyName) =>
                    setOrderInput({
                      ...orderInput,
                      assigneeCompanyName
                    })
                  }
                  value={orderInput.assigneeCompanyName ?? ''}
                  readonly={props.disabled || user?.role !== UserRole.ADMIN}
                />
              </LabeledInput>
            </RowOfInputs>
          )}

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
                file: null,
                focus: true
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
              <FlexRow>
                <Label>Kerättävät dokumentit</Label>
                <InfoButton
                  onClick={() =>
                    setShowCollectedDocumentsInfo(!showCollectedDocumentsInfo)
                  }
                />
              </FlexRow>
              {showCollectedDocumentsInfo && (
                <InfoBox
                  message={
                    <P>
                      Tässä valitaan selvityksessä tuotettavat
                      paikkatietoaineistot
                    </P>
                  }
                />
              )}
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
