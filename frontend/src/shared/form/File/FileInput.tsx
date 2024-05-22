// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderFileDocumentType } from 'api/order-api'
import { FileValidationError, ReportFileDocumentType } from 'api/report-api'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { InputField, InputFieldUnderRow } from 'shared/form/InputField'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  FlexCol,
  FlexRowWithGaps,
  LabeledInput,
  VerticalGap
} from '../../../shared/layout'
import { Label } from '../../typography'
import { UnderRowStatusIcon } from '../StatusIcon'

import { FileInputField } from './FileInputField'
import { FileTitle } from './FileTitle'

export interface ValidFileInputData<T> {
  description: string
  file: File
  documentType: T
}

export interface FileInputData {
  description: string
  file: File | null
}

interface FileInputProps<T> {
  documentType: T
  data: FileInputData
  errors?: FileValidationError[]
  onChange: (data: FileInputData) => void
}

const fileValidationErrorToMessage = (error: FileValidationError): string => {
  if (error.reason === 'IS_NULL') {
    return `${error.column}: tyhjä arvo ei sallittu`
  }
  return `${error.column}:  ${error.reason}`
}

export const FileInput = <
  T extends ReportFileDocumentType | OrderFileDocumentType
>({
  data,
  documentType,
  onChange,
  errors
}: FileInputProps<T>) => {
  const [file, setFile] = useState(data.file ?? null)
  const [description, setDescription] = useDebouncedState(data.description)

  useEffect(() => {
    onChange({ file, description })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, description])

  const errorMessage =
    errors && errors.length > 0
      ? {
          text: [
            'Tiedosto sisältää seuraavat virheet:',
            ...errors.map((e) => fileValidationErrorToMessage(e))
          ],
          status: 'warning' as const
        }
      : undefined

  return (
    <FlexCol>
      <FlexRowWithGaps $gapSize="s" style={{ marginBottom: '5px' }}>
        <LabeledInput $cols={5}>
          <FileTitle
            documentType={documentType}
            required={documentType !== ReportFileDocumentType.OTHER}
          />
          <VerticalGap $size="s" />
          <FileInputField
            onChange={(fileList) => {
              const file = fileList?.[0]
              file && setFile(file)
            }}
          />
        </LabeledInput>
        <LabeledInput $cols={5}>
          <Label>Liitteen kuvaus</Label>
          <InputField
            onChange={(value) => {
              setDescription(value)
            }}
            value={description}
          />
        </LabeledInput>
      </FlexRowWithGaps>
      {errorMessage && (
        <FlexRowWithGaps>
          <InputFieldUnderRow className={classNames('warning')}>
            <span>
              {errorMessage.text.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </span>
            <UnderRowStatusIcon status="warning" />
          </InputFieldUnderRow>
        </FlexRowWithGaps>
      )}
    </FlexCol>
  )
}
