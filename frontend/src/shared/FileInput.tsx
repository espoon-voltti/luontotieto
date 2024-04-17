// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import { InputField } from 'shared/form/InputField'
import { useDebouncedState } from 'shared/useDebouncedState'

import { LabeledInput, RowOfInputs } from '../shared/layout'
import { Label } from '../shared/typography'
import { FileInputField } from 'shared/form/FileInputField'
import { ReportFileDocumentType, getDocumentTypeTitle } from 'api/report-api'
import { OrderFileDocumentType } from 'api/order-api'

export interface ValidFileInputData<T> {
  description: string
  file: File
  documentType: T
}

export interface FileInputData<T> {
  description: string
  file: File | null
  documentType: T
}

interface FileInputProps<T> {
  data: FileInputData<T>
  onChange: (data: FileInputData<T>) => void
}

export const FileInput = <
  T extends ReportFileDocumentType | OrderFileDocumentType
>({
  data,
  onChange
}: FileInputProps<T>) => {
  const [file, setFile] = useState(data.file ?? null)
  const [description, setDescription] = useDebouncedState(data.description)

  useEffect(() => {
    onChange({ file, description, documentType: data.documentType })
  }, [file, description])

  return (
    <RowOfInputs>
      <LabeledInput $cols={4}>
        <Label>
          {getDocumentTypeTitle<ReportFileDocumentType | OrderFileDocumentType>(
            data.documentType
          )}
        </Label>
        <FileInputField
          onChange={(fileList) => {
            const file = fileList?.[0]
            file && setFile(file)
          }}
        />
      </LabeledInput>
      <LabeledInput $cols={4}>
        <Label>Tiedoston kuvaus</Label>
        <InputField
          onChange={(value) => {
            setDescription(value)
          }}
          value={description}
        />
      </LabeledInput>
    </RowOfInputs>
  )
}
