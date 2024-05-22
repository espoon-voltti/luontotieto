// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { OrderReportDocumentInput } from 'api/order-api'
import {
  FileValidationErrorResponse,
  ReportDetails,
  ReportFileDetails,
  ReportFileDocumentType,
  ReportFormInput
} from 'api/report-api'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InlineButton } from 'shared/buttons/InlineButton'
import { ExistingFile } from 'shared/form/File/ExistingFile'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { TextArea } from 'shared/form/TextArea'
import { useDebouncedState } from 'shared/useDebouncedState'
import styled from 'styled-components'

import {
  FlexCol,
  GroupOfInputRows,
  LabeledInput,
  VerticalGap
} from '../../shared/layout'
import { H3, Label } from '../../shared/typography'

const StyledInlineButton = styled(InlineButton)`
  font-size: 0.9rem;
`

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: ReportFormInput | null) => void
  saveErrors?: FileValidationErrorResponse[]
}

interface EditProps {
  mode: 'EDIT'
  report: ReportDetails
  reportFiles: ReportFileDetails[]
  onChange: (validInput: ReportFormInput | null) => void
  saveErrors?: FileValidationErrorResponse[]
}
type Props = CreateProps | EditProps

interface ReportFileInputElementNew {
  type: 'NEW'
  userDescription: string
  documentType: ReportFileDocumentType
  file: File | null
}

interface ReportFileInputElementExisting {
  type: 'EXISTING'
  userDescription: string
  documentType: ReportFileDocumentType
  details: ReportFileDetails
}

type ReportFileInputElement =
  | ReportFileInputElementNew
  | ReportFileInputElementExisting

function createFileInputs(
  reportFiles: ReportFileDetails[],
  requiredFiles: OrderReportDocumentInput[]
): ReportFileInputElement[] {
  const requiredFileInputs = requiredFiles.map((required) => {
    const reportFile = reportFiles.find(
      (reportFile) => reportFile.documentType === required.documentType
    )
    return reportFile
      ? {
          type: 'EXISTING' as const,
          userDescription: reportFile.description,
          documentType: required.documentType,
          details: reportFile
        }
      : {
          type: 'NEW' as const,
          userDescription: '',
          documentType: required.documentType,
          file: null
        }
  })
  const otherFiles = reportFiles
    .filter((rf) => rf.documentType === ReportFileDocumentType.OTHER)
    .map((rf) => ({
      type: 'EXISTING' as const,
      userDescription: rf.description,
      documentType: rf.documentType,
      details: rf
    }))

  return [...requiredFileInputs, ...otherFiles]
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
      fileInput?.type === 'EXISTING' ||
      (fileInput?.file && fileInput.userDescription.trim() !== '')
    )
  })
}

export const ReportForm = React.memo(function ReportForm(props: Props) {
  const reportIsAlreadyApproved = props.mode === 'EDIT' && props.report.approved
  const requiredFiles = useMemo(
    () =>
      props.mode === 'EDIT' ? props.report.order?.reportDocuments ?? [] : [],
    [props]
  )
  const originalFileInputs = useMemo(() => {
    const reportFiles = props.mode === 'EDIT' ? props.reportFiles : []
    return createFileInputs(reportFiles, requiredFiles)
  }, [requiredFiles, props])

  const [name, _] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.name
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.description
  )

  const [fileInputs, setFileInputs] = useState(originalFileInputs)

  const updateFileInput = useCallback(
    (modified: FileInputData & { documentType: ReportFileDocumentType }) => {
      setFileInputs(
        fileInputs.map((fi) => {
          if (fi.documentType === modified.documentType) {
            return {
              ...fi,
              userDescription: modified.description,
              file: modified.file
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
            documentType: fi.documentType
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
        documentType: documentType
      }
    ])
  }

  const validInput: ReportFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null

    if (!filesAreValid(requiredFiles, fileInputs)) return null

    return {
      name: name.trim(),
      description: description.trim(),
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
  }, [name, description, fileInputs, requiredFiles, originalFileInputs])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props])

  return (
    <FlexCol>
      <H3>Selvitettävät asiat</H3>
      <VerticalGap $size="m" />
      <GroupOfInputRows>
        {fileInputs.map((fInput, index) => {
          const documentSaveError = props.saveErrors
            ? props.saveErrors.find(
                (error) => error.documentType === fInput.documentType
              )
            : undefined

          switch (fInput.type) {
            case 'NEW':
              return (
                <FileInput
                  documentType={fInput.documentType}
                  key={fInput.documentType + index}
                  data={{
                    description: fInput.userDescription,
                    file: fInput.file
                  }}
                  onChange={(data) => {
                    updateFileInput({
                      ...data,
                      documentType: fInput.documentType
                    })
                  }}
                  errors={documentSaveError?.errors}
                />
              )
            case 'EXISTING':
              return (
                <ExistingFile
                  key={fInput.documentType + index}
                  data={{
                    type: 'REPORT',
                    file: fInput.details,
                    readonly: reportIsAlreadyApproved,
                    documentType: fInput.documentType
                  }}
                  onRemove={(id) => {
                    removeCreatedFileInput(id)
                  }}
                />
              )
          }
        })}
        <StyledInlineButton
          text="Lisää muu liite"
          icon={faPlus}
          onClick={() => addFileInput(ReportFileDocumentType.OTHER)}
        />
      </GroupOfInputRows>
      <VerticalGap $size="m" />
      <LabeledInput $cols={4}>
        <Label>Yhteenveto</Label>
        <TextArea
          onChange={setDescription}
          value={description}
          rows={2}
          readonly={reportIsAlreadyApproved}
        />
      </LabeledInput>
      <VerticalGap $size="m" />
    </FlexCol>
  )
})
