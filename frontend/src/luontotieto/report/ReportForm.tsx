// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderReportDocumentInput } from 'api/order-api'
import {
  ReportDetails,
  ReportFileDetails,
  ReportFileDocumentType,
  ReportFileInput,
  ReportFormInput,
  reportFileDocumentTypes
} from 'api/report-api'
import React, { useEffect, useMemo, useState } from 'react'
import { FileInput, FileInputData } from 'shared/FileInput'
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
import { H2, Label } from '../../shared/typography'

import { ReportFormFile } from './ReportFormFile'

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
  documentDescription: string | null
  file: File | null
}

interface ReportFileInputElementCreated {
  type: 'CREATED'
  userDescription: string
  documentType: ReportFileDocumentType
  documentDescription: string | null
  details: ReportFileDetails
}

type ReportFileInputElement =
  | ReportFileInputElementNew
  | ReportFileInputElementCreated

function createFileInputs(
  props: Props,
  requiredFiles: OrderReportDocumentInput[]
): ReportFileInputElement[] {
  const reportFiles = props.mode === 'EDIT' ? props.reportFiles : []

  if (requiredFiles.length === 0) {
    // Display inputs for all possible file types
    return reportFileDocumentTypes.map((type) => {
      const reportFile = reportFiles.find(
        (reportFile) => reportFile.documentType === type
      )
      return reportFile
        ? {
            type: 'CREATED',
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
            type: 'CREATED',
            userDescription: reportFile.description,
            documentType: required.documentType,
            documentDescription: required.description,
            details: reportFile
          }
        : {
            type: 'NEW',
            userDescription: '',
            documentType: required.documentType,
            documentDescription: required.description,
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
      fileInput?.type === 'CREATED' ||
      (fileInput?.file && fileInput.userDescription.trim() !== '')
    )
  })
}

export const ReportForm = React.memo(function ReportForm(props: Props) {
  const debounceDelay = 1500

  const requiredFiles = useMemo(() => {
    switch (props.mode) {
      case 'CREATE':
        return []
      case 'EDIT':
        return props.report.order?.reportDocuments ?? []
    }
  }, [props])

  const originalFileInputs: ReportFileInputElement[] = useMemo(
    () => createFileInputs(props, requiredFiles),
    [requiredFiles, props]
  )

  const [name, setName] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.name,
    debounceDelay
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.description,
    debounceDelay
  )

  const [fileInputsS, setFileInputs] = useState(originalFileInputs)

  const updateFileInput = (modified: FileInputData<ReportFileDocumentType>) => {
    setFileInputs(
      fileInputsS.map((fi) => {
        if (fi.documentType === modified.documentType) {
          return {
            ...fi,
            userDescription: modified.description,
            file: modified.file
          }
        } else {
          return { ...fi }
        }
      })
    )
  }

  const removeCreatedFileInput = (id: string) => {
    setFileInputs(
      fileInputsS.map((fi) => {
        if (fi.type === 'CREATED' && fi.details.id === id) {
          return {
            type: 'NEW',
            file: null,
            userDescription: '',
            documentType: fi.documentType,
            documentDescription: fi.documentDescription
          }
        }
        return fi
      })
    )
  }

  const validInput: ReportFormInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null

    if (!filesAreValid(requiredFiles, fileInputsS)) return null

    return {
      name: name.trim(),
      description: description.trim(),
      filesToAdd: fileInputsS.reduce(
        (acc: ReportFileInput[], cur: ReportFileInputElement) => {
          if (cur.type === 'CREATED' || cur.file === null) {
            return acc
          }
          return [
            ...acc,
            {
              description: cur.userDescription,
              documentType: cur.documentType,
              file: cur.file
            }
          ]
        },
        []
      ),
      filesToRemove: originalFileInputs.reduce(
        (acc: string[], cur: ReportFileInputElement) => {
          if (
            cur.type === 'CREATED' &&
            fileInputsS.find(
              (fi) => fi.type === 'NEW' && fi.documentType == cur.documentType
            )
          ) {
            return [cur.details.id, ...acc]
          }
          return acc
        },
        []
      )
    }
  }, [name, description, fileInputsS, requiredFiles, originalFileInputs])

  useEffect(() => {
    props.onChange(validInput)
  }, [validInput, props])

  return (
    <FlexCol>
      <GroupOfInputRows>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Selvityksen nimi</Label>
            <InputField onChange={setName} value={name} />
          </LabeledInput>
        </RowOfInputs>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Selvityksen kuvaus</Label>
            <TextArea onChange={setDescription} value={description} rows={2} />
          </LabeledInput>
        </RowOfInputs>
      </GroupOfInputRows>
      <VerticalGap $size="XL" />
      <H2>Tiedostot</H2>
      <VerticalGap $size="m" />
      <GroupOfInputRows>
        {fileInputsS.map((fInput) => {
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
            case 'CREATED':
              return (
                <ReportFormFile
                  details={fInput.details}
                  onRemove={(id) => {
                    removeCreatedFileInput(id)
                  }}
                />
              )
          }
        })}
      </GroupOfInputRows>

      <VerticalGap $size="XL" />
    </FlexCol>
  )
})
