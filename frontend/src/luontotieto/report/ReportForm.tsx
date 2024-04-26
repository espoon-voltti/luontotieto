// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderReportDocumentInput } from 'api/order-api'
import {
  ReportDetails,
  ReportFileDetails,
  ReportFileDocumentType,
  ReportFormInput,
  reportFileDocumentTypes
} from 'api/report-api'
import React, { useEffect, useMemo, useState } from 'react'
import { FileInput, FileInputData } from 'shared/form/File/FileInput'
import { TextArea } from 'shared/form/TextArea'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  FlexCol,
  GroupOfInputRows,
  LabeledInput,
  VerticalGap
} from '../../shared/layout'
import { H3, Label } from '../../shared/typography'

import { ExistingFile } from 'shared/form/File/ExistingFile'

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: ReportFormInput | null) => void
}

interface EditProps {
  mode: 'EDIT'
  report: ReportDetails
  reportFiles: ReportFileDetails[]
  onChange: (validInput: ReportFormInput | null) => void
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
  if (requiredFiles.length === 0) {
    // Display inputs for all possible file types
    return reportFileDocumentTypes.map((type) => {
      const reportFile = reportFiles.find(
        (reportFile) => reportFile.documentType === type
      )
      return reportFile
        ? {
            type: 'EXISTING',
            userDescription: reportFile.description,
            documentType: type,
            documentDescription: null,
            details: reportFile
          }
        : {
            type: 'NEW',
            userDescription: '',
            documentType: type,
            documentDescription: null,
            file: null
          }
    })
  } else {
    return requiredFiles.map((required) => {
      const reportFile = reportFiles.find(
        (reportFile) => reportFile.documentType === required.documentType
      )
      return reportFile
        ? {
            type: 'EXISTING',
            userDescription: reportFile.description,
            documentType: required.documentType,
            details: reportFile
          }
        : {
            type: 'NEW',
            userDescription: '',
            documentType: required.documentType,
            file: null
          }
    })
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

  const updateFileInput = (modified: FileInputData<ReportFileDocumentType>) => {
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
  }

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
        {fileInputs.map((fInput) => {
          switch (fInput.type) {
            case 'NEW':
              return (
                <FileInput
                  key={fInput.documentType}
                  data={{
                    description: fInput.userDescription,
                    file: fInput.file,
                    documentType: fInput.documentType
                  }}
                  onChange={(data) => {
                    updateFileInput(data)
                  }}
                />
              )
            case 'EXISTING':
              return (
                <ExistingFile
                  key={fInput.documentType}
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
