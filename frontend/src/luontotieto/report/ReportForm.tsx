// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  faArrowUpRightFromSquare,
  faExternalLink,
  faPlus
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { OrderReportDocumentInput } from 'api/order-api'
import {
  ReportDetails,
  ReportFileDetails,
  ReportFileDocumentType,
  ReportFileValidationErrorResponse,
  ReportFormInput
} from 'api/report-api'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InfoBox } from 'shared/MessageBoxes'
import { InfoButton } from 'shared/buttons/InfoButton'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Checkbox } from 'shared/form/Checkbox'
import { ExistingFile } from 'shared/form/File/ExistingFile'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { useDebouncedState } from 'shared/useDebouncedState'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'

import {
  FlexCol,
  FlexRow,
  GroupOfInputRows,
  LabeledInput,
  VerticalGap
} from '../../shared/layout'
import { A, H3, Label, P } from '../../shared/typography'

const StyledInlineButton = styled(InlineButton)`
  font-size: 0.9rem;
`

const InstructionsLink = styled.span`
  text-decoration: underline;
  margin-right: 10px;
`

interface ReportFormProps {
  report: ReportDetails
  reportFiles: ReportFileDetails[]
  onChange: (validInput: ReportFormInput | null) => void
  saveErrors?: ReportFileValidationErrorResponse[]
  readOnly: boolean
}

interface ReportFileInputElementNew {
  type: 'NEW'
  userDescription: string
  documentType: ReportFileDocumentType
  file: File | null
  id: string
  noObservation: boolean
  focus?: boolean
}

interface ReportFileInputElementExisting {
  type: 'EXISTING'
  userDescription: string
  documentType: ReportFileDocumentType
  details: ReportFileDetails
  noObservation: boolean
  id: string
}

type ReportFileInputElement =
  | ReportFileInputElementNew
  | ReportFileInputElementExisting

function getAcceptedFileTypes(
  documentType: ReportFileDocumentType
): string | undefined {
  switch (documentType) {
    case ReportFileDocumentType.REPORT:
      return '.pdf'
    case ReportFileDocumentType.OTHER:
      return undefined
    default:
      return '.gpkg'
  }
}

function createFileInputElement(
  documentType: ReportFileDocumentType,
  reportFiles: ReportFileDetails[],
  inMemoryFiles: ReportFileInputElement[]
): ReportFileInputElement {
  const existingFile = reportFiles.find(
    (rf) => rf.documentType === documentType
  )
  if (existingFile) {
    return {
      type: 'EXISTING' as const,
      userDescription: existingFile.description,
      documentType: existingFile.documentType,
      details: existingFile,
      noObservation: false,
      id: existingFile.id
    } satisfies ReportFileInputElement
  }
  const inMemoryFile = inMemoryFiles.find(
    (imf) => documentType === imf.documentType
  )
  if (inMemoryFile) {
    return inMemoryFile satisfies ReportFileInputElement
  }

  return {
    type: 'NEW' as const,
    userDescription: '',
    documentType: documentType,
    file: null,
    id: uuidv4(),
    noObservation: false
  } satisfies ReportFileInputElement
}

function createFileInputs(
  reportFiles: ReportFileDetails[],
  requiredFiles: OrderReportDocumentInput[],
  noObservations: string[],
  inMemoryFiles: ReportFileInputElement[]
): ReportFileInputElement[] {
  const requiredFileInputs = requiredFiles.map((required) => {
    const noObservation = noObservations.includes(required.documentType)
    return {
      ...createFileInputElement(
        required.documentType,
        reportFiles,
        inMemoryFiles
      ),
      noObservation
    }
  })

  // This is the order we want to hold for the additional in memory files
  const inMemoryOtherFileIds = inMemoryFiles
    .filter((imf) => imf.documentType === ReportFileDocumentType.OTHER)
    .map((imf) => imf.id)

  const existingOtherFileIds = reportFiles
    .filter((rf) => rf.documentType === ReportFileDocumentType.OTHER)
    .map((rf) => rf.id)

  const otherFileIds = [
    ...new Set([...inMemoryOtherFileIds, ...existingOtherFileIds])
  ]

  const otherFiles: (ReportFileInputElement | null)[] = otherFileIds.map(
    (fileId) => {
      const existingFile = reportFiles.find((rf) => rf.id === fileId)
      if (existingFile) {
        return {
          type: 'EXISTING' as const,
          userDescription: existingFile.description,
          documentType: existingFile.documentType,
          details: existingFile,
          noObservation: false,
          id: existingFile.id
        } satisfies ReportFileInputElement
      }
      const inMemoryFile = inMemoryFiles.find(
        (imf) => imf.type === 'NEW' && imf.id === fileId
      )
      if (inMemoryFile && inMemoryFile.type === 'NEW') {
        return inMemoryFile satisfies ReportFileInputElement
      }
      return null
    }
  )

  const mappedReportInfo = createFileInputElement(
    ReportFileDocumentType.REPORT,
    reportFiles,
    inMemoryFiles
  )
  const mappedAluerajaus = createFileInputElement(
    ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS,
    reportFiles,
    inMemoryFiles
  )

  return [
    ...requiredFileInputs,
    mappedReportInfo,
    mappedAluerajaus,
    ...otherFiles.flatMap((of) => (of !== null ? [of] : []))
  ]
}

function hasReportDocument(fileInputs: ReportFileInputElement[]): boolean {
  const reportDocument = fileInputs.find(
    (input) => input.documentType === ReportFileDocumentType.REPORT
  )
  if (!reportDocument) {
    return false
  } else {
    return reportDocument?.type === 'EXISTING' || !!reportDocument?.file
  }
}

function hasAluerajausDocument(fileInputs: ReportFileInputElement[]): boolean {
  const aluerajausDocument = fileInputs.find(
    (input) =>
      input.documentType === ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS
  )
  if (!aluerajausDocument) {
    return false
  } else {
    return aluerajausDocument?.type === 'EXISTING' || !!aluerajausDocument?.file
  }
}

function filesAreValid(
  requiredFiles: OrderReportDocumentInput[],
  fileInputs: ReportFileInputElement[]
): boolean {
  return requiredFiles.every((required) => {
    const fileInput = fileInputs.find(
      (fi) => fi.documentType === required.documentType
    )

    return (
      fileInput?.noObservation ||
      fileInput?.type === 'EXISTING' ||
      fileInput?.file
    )
  })
}

export const ReportForm = React.memo(function ReportForm(
  props: ReportFormProps
) {
  const readOnly = props.readOnly || props.report.approved
  const requiredFiles = useMemo(
    () => props.report.order?.reportDocuments ?? [],
    [props]
  )
  const [noObservations, _setNoObservations] = useState<
    ReportFileDocumentType[] | null
  >(props.report.noObservations)

  const originalFileInputs = useMemo(
    () =>
      createFileInputs(
        props.reportFiles ?? [],
        requiredFiles,
        noObservations ?? [],
        []
      ),
    [requiredFiles, props.reportFiles, noObservations]
  )

  const [name, _] = useDebouncedState(props.report.name)
  const [isPublic, setIsPublic] = useState<boolean | null>(
    props.report.isPublic
  )

  const [fileInputs, setFileInputs] = useState(originalFileInputs)

  const updateFileInput = useCallback(
    (
      modified: FileInputData & { noObservation: boolean } & {
        documentType: ReportFileDocumentType
      }
    ) => {
      setFileInputs(
        fileInputs.map((fi) => {
          if (fi.documentType === modified.documentType) {
            return {
              ...fi,
              userDescription: modified.description,
              file: modified.file,
              noObservation: modified.noObservation
            }
          }
          return fi
        })
      )
    },
    [setFileInputs, fileInputs]
  )

  const removeCreatedFileInput = (id: string) => {
    setFileInputs(
      fileInputs.map((fi) => {
        if (fi.type === 'EXISTING' && fi.details.id === id) {
          return {
            type: 'NEW',
            file: null,
            userDescription: '',
            documentType: fi.documentType,
            id: uuidv4(),
            noObservation: false
          }
        }
        return fi
      })
    )
  }

  const addFileInput = (documentType: ReportFileDocumentType) => {
    setFileInputs([
      ...fileInputs,
      {
        type: 'NEW',
        file: null,
        userDescription: '',
        documentType: documentType,
        id: uuidv4(),
        noObservation: false,
        focus: true
      }
    ])
  }

  const reportInput: ReportFormInput | null = useMemo(() => {
    let valid = true
    const filesToRemove = originalFileInputs.flatMap((e) =>
      e.type === 'EXISTING' &&
      !fileInputs.find(
        (fi) => fi.type === 'EXISTING' && fi.details.id === e.details.id
      )
        ? [e.details.id]
        : []
    )

    if (name.trim() === '') valid = false
    if (isPublic === null) valid = false

    if (!filesAreValid(requiredFiles, fileInputs)) valid = false
    if (!hasReportDocument(fileInputs)) valid = false
    if (!hasAluerajausDocument(fileInputs)) valid = false

    const noObs = fileInputs.flatMap((input) =>
      input.noObservation ? [input.documentType] : []
    )
    return {
      name: name.trim(),
      isPublic: isPublic !== null ? isPublic : undefined,
      noObservations: noObs,
      filesToAdd: fileInputs.flatMap((e) =>
        e.type === 'NEW' && e.file !== null
          ? [
              {
                id: e.id,
                description: e.userDescription,
                documentType: e.documentType,
                file: e.file
              }
            ]
          : []
      ),
      filesToRemove,
      valid
    }
  }, [name, fileInputs, requiredFiles, originalFileInputs, isPublic])

  useEffect(() => {
    props.onChange(reportInput)
  }, [reportInput, props])

  useEffect(() => {
    setFileInputs(
      createFileInputs(
        props.reportFiles ?? [],
        requiredFiles,
        noObservations ?? [],
        fileInputs
      )
    )
  }, [originalFileInputs])

  return (
    <FlexCol>
      <H3>Selvityksen tiedot</H3>
      <VerticalGap $size="m" />
      <A
        href="https://www.espoo.fi/fi/espoon-luontotietoaineistot#paikkatietojen-toimittaminen-luontoselvitysten-yhteydess-61377"
        target="_blank"
        aria-description="External link"
      >
        <InstructionsLink>
          Ohjeet paikkatietojen toimittamisesta luontoselvitysten yhteydessä
        </InstructionsLink>
        <FontAwesomeIcon
          style={{ marginLeft: '10px' }}
          icon={faArrowUpRightFromSquare}
        />
      </A>
      <VerticalGap $size="m" />
      <GroupOfInputRows>
        {fileInputs.map((fInput) => {
          const documentSaveError = props.saveErrors
            ? props.saveErrors.find(
                (error) => error.documentType === fInput.documentType
              )
            : undefined
          switch (fInput.type) {
            case 'NEW':
              return (
                <>
                  <FileInput
                    readOnly={readOnly}
                    documentType={fInput.documentType}
                    key={fInput.id}
                    data={{
                      description: fInput.userDescription,
                      file: fInput.file,
                      id: fInput.id,
                      focus: fInput.focus
                    }}
                    noObservation={fInput.noObservation}
                    onChange={(data) => {
                      updateFileInput({
                        ...data,
                        documentType: fInput.documentType
                      })
                    }}
                    accept={getAcceptedFileTypes(fInput.documentType)}
                    errors={documentSaveError?.errors}
                  />
                  {fInput.documentType === ReportFileDocumentType.REPORT && (
                    <ReportFileIsPublic
                      readOnly={readOnly}
                      isPublic={props.report.isPublic}
                      onChange={(value) => setIsPublic(value)}
                    />
                  )}
                </>
              )
            case 'EXISTING':
              return (
                <>
                  <ExistingFile
                    key={fInput.details.id}
                    data={{
                      type: 'REPORT',
                      file: fInput.details,
                      readonly: readOnly,
                      documentType: fInput.documentType,
                      updated: fInput.details.updated
                    }}
                    onRemove={(id) => {
                      removeCreatedFileInput(id)
                    }}
                  />
                  {fInput.documentType === ReportFileDocumentType.REPORT && (
                    <ReportFileIsPublic
                      readOnly={readOnly}
                      isPublic={props.report.isPublic}
                      onChange={(value) => setIsPublic(value)}
                    />
                  )}
                </>
              )
          }
        })}
        {!readOnly && (
          <StyledInlineButton
            text="Lisää liite"
            icon={faPlus}
            onClick={() => addFileInput(ReportFileDocumentType.OTHER)}
          />
        )}
      </GroupOfInputRows>
      <VerticalGap $size="m" />
    </FlexCol>
  )
})

export const ReportFileIsPublic = React.memo(function ReportFileIsPublic({
  onChange,
  readOnly,
  isPublic
}: {
  onChange: (isPublic: boolean) => void
  readOnly: boolean
  isPublic: boolean | null
}) {
  const [localPublic, setLocalPublic] = useState<boolean | null>(isPublic)
  const [showInfoBox, setShowInfoBox] = useState<boolean>(false)
  return (
    <InnerContainer>
      <LabeledInput $cols={8}>
        <FlexRow>
          <Label>Onko selvitysraportti julkinen? *</Label>
          <InfoButton onClick={() => setShowInfoBox(!showInfoBox)} />
        </FlexRow>
        <VerticalGap $size="s" />
        {showInfoBox && (
          <InfoBox
            message={
              <>
                <P>
                  {`Julkinen selvitysraportti julkaistaan avoimessa verkossa ja
                  Espoon paikkatietojärjestelmässä. Jos raportti on tarkoitettu
                  vain viranomaiskäyttöön, se ei voi olla julkinen. Vain
                  viranomaiskäyttöön tarkoitettu (ei julkinen) raportti voi
                  sisältää esimerkiksi sensitiivisiä lajitietoja tai sen käyttö
                  voi olla rajattu henkilötietojen takia. Lisätietoja
                  sensitiivisestä lajitiedosta saat `}
                  <A
                    href="https://laji.fi/sensitiiviset"
                    target="_blank"
                    style={{ textDecoration: 'underline' }}
                  >
                    täältä
                    <FontAwesomeIcon
                      icon={faExternalLink}
                      style={{ marginLeft: '6px' }}
                    />
                  </A>
                </P>
              </>
            }
          />
        )}
        <FlexRow>
          <Checkbox
            key="yes"
            label="Kyllä"
            checked={!!localPublic}
            onChange={(_checked) => {
              setLocalPublic(true)
              onChange(true)
            }}
            disabled={readOnly}
          />
          <StyledCheckBox
            key="no"
            label="Ei"
            checked={localPublic === false}
            onChange={(_checked) => {
              setLocalPublic(false)
              onChange(false)
            }}
            disabled={readOnly}
          />
        </FlexRow>
      </LabeledInput>
    </InnerContainer>
  )
})

export const InnerContainer = styled.div`
  padding-left: 32px;
`
export const StyledCheckBox = styled(Checkbox)`
  padding-left: 32px;
`
