// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { OrderReportDocumentInput } from 'api/order-api'
import {
  ReportDetails,
  ReportFileDetails,
  ReportFileDocumentType,
  ReportFileValidationErrorResponse,
  ReportFormInput
} from 'api/report-api'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InlineButton } from 'shared/buttons/InlineButton'
import { ExistingFile } from 'shared/form/File/ExistingFile'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { useDebouncedState } from 'shared/useDebouncedState'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'

import { FlexCol, GroupOfInputRows, VerticalGap } from '../../shared/layout'
import { H3 } from '../../shared/typography'

const StyledInlineButton = styled(InlineButton)`
  font-size: 0.9rem;
`

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: ReportFormInput | null) => void
  saveErrors?: ReportFileValidationErrorResponse[]
  readOnly: boolean
}

interface EditProps {
  mode: 'EDIT'
  report: ReportDetails
  reportFiles: ReportFileDetails[]
  onChange: (validInput: ReportFormInput | null) => void
  saveErrors?: ReportFileValidationErrorResponse[]
  readOnly: boolean
}

type Props = CreateProps | EditProps

interface ReportFileInputElementNew {
  type: 'NEW'
  userDescription: string
  documentType: ReportFileDocumentType
  file: File | null
  id: string
  noObservation: boolean
}

interface ReportFileInputElementExisting {
  type: 'EXISTING'
  userDescription: string
  documentType: ReportFileDocumentType
  details: ReportFileDetails
  noObservation: boolean
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

function createFileInputs(
  reportFiles: ReportFileDetails[],
  requiredFiles: OrderReportDocumentInput[],
  noObservations: string[]
): ReportFileInputElement[] {
  const requiredFileInputs = requiredFiles.map((required) => {
    const reportFile = reportFiles.find(
      (reportFile) => reportFile.documentType === required.documentType
    )
    const noObservation = noObservations.includes(required.documentType)
    return reportFile
      ? {
          type: 'EXISTING' as const,
          userDescription: reportFile.description,
          documentType: required.documentType,
          details: reportFile,
          noObservation
        }
      : {
          type: 'NEW' as const,
          userDescription: '',
          documentType: required.documentType,
          file: null,
          id: uuidv4(),
          noObservation
        }
  })
  const otherFiles = reportFiles
    .filter((rf) => rf.documentType === ReportFileDocumentType.OTHER)
    .map((rf) => ({
      type: 'EXISTING' as const,
      userDescription: rf.description,
      documentType: rf.documentType,
      details: rf,
      noObservation: false
    }))

  const reportInfo = reportFiles.find(
    (rf) => rf.documentType === ReportFileDocumentType.REPORT
  )

  const mappedReportInfo = reportInfo
    ? {
        type: 'EXISTING' as const,
        userDescription: reportInfo.description,
        documentType: reportInfo.documentType,
        details: reportInfo,
        noObservation: false
      }
    : {
        type: 'NEW' as const,
        userDescription: '',
        documentType: ReportFileDocumentType.REPORT,
        file: null,
        id: uuidv4(),
        noObservation: false
      }

  const aluerajaus = reportFiles.find(
    (rf) => rf.documentType === ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS
  )

  const mappedAluerajaus = aluerajaus
    ? {
        type: 'EXISTING' as const,
        userDescription: aluerajaus.description,
        documentType: aluerajaus.documentType,
        details: aluerajaus,
        noObservation: false
      }
    : {
        type: 'NEW' as const,
        userDescription: '',
        documentType: ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS,
        file: null,
        id: uuidv4(),
        noObservation: false
      }

  return [
    ...requiredFileInputs,
    ...otherFiles,
    mappedReportInfo,
    mappedAluerajaus
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

export const ReportForm = React.memo(function ReportForm(props: Props) {
  const readOnly =
    props.readOnly || (props.mode === 'EDIT' && props.report.approved)
  const requiredFiles = useMemo(
    () =>
      props.mode === 'EDIT' ? props.report.order?.reportDocuments ?? [] : [],
    [props]
  )
  const [noObservations, _setNoObservations] = useState<
    ReportFileDocumentType[] | null
  >(props.mode === 'CREATE' ? null : props.report.noObservations)

  const originalFileInputs = useMemo(() => {
    const reportFiles = props.mode === 'EDIT' ? props.reportFiles : []
    return createFileInputs(reportFiles, requiredFiles, noObservations ?? [])
  }, [requiredFiles, props, noObservations])

  const [name, _] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.name
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
        noObservation: false
      }
    ])
  }

  const validInput: ReportFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (!filesAreValid(requiredFiles, fileInputs)) return null
    if (!hasReportDocument(fileInputs)) return null

    const noObs = fileInputs.flatMap((input) =>
      input.noObservation ? [input.documentType] : []
    )
    return {
      name: name.trim(),
      noObservations: noObs,
      filesToAdd: fileInputs.flatMap((e) =>
        e.type === 'NEW' && e.file !== null
          ? [
              {
                description: e.userDescription,
                documentType: e.documentType,
                file: e.file
              }
            ]
          : []
      ),
      filesToRemove: originalFileInputs.flatMap((e) =>
        e.type === 'EXISTING' &&
        !fileInputs.find(
          (fi) => fi.type === 'EXISTING' && fi.details.id === e.details.id
        )
          ? [e.details.id]
          : []
      )
    }
  }, [name, fileInputs, requiredFiles, originalFileInputs])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props])

  return (
    <FlexCol>
      <H3>Selvityksen tiedot</H3>
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
                <FileInput
                  readOnly={readOnly}
                  documentType={fInput.documentType}
                  key={fInput.id}
                  data={{
                    description: fInput.userDescription,
                    file: fInput.file,
                    id: fInput.id
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
              )
            case 'EXISTING':
              return (
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
