// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderFileDocumentType, OrderFileValidationError } from 'api/order-api'
import {
  ReportFileDocumentType,
  ReportFileValidationError
} from 'api/report-api'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { InputField, InputFieldUnderRow } from 'shared/form/InputField'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  FlexCol,
  FlexRowWithGaps,
  LabeledInput,
  VerticalGap
} from '../../layout'
import { Label } from '../../typography'
import { Checkbox } from '../Checkbox'
import { UnderRowStatusIcon } from '../StatusIcon'

import { FileInputField } from './FileInputField'
import { FileTitle } from './FileTitle'

export interface FileInputData {
  description: string
  file: File | null
  id: string
}

interface FileInputProps<T> {
  documentType: T
  data: FileInputData
  errors?: ReportFileValidationError[] | OrderFileValidationError[] | string
  onChange: (data: FileInputData & { noObservation: boolean }) => void
  showTitle?: boolean
  readOnly?: boolean
  noObservation?: boolean
  accept?: string
}

const fileValidationErrorToMessage = (
  error: ReportFileValidationError | OrderFileValidationError
): string => {
  if (error.reason === 'IS_NULL') {
    return `${error.id}: ${error.column}: tyhjä arvo ei sallittu`
  } else if (error.reason === 'WRONG_TYPE') {
    return `${error.id}: ${error.column}: väärä tietotyyppi`
  }
  return `${error.id}: ${error.column}:  ${error.reason}`
}

const isReportFileNatureDocument = (
  dt: ReportFileDocumentType | OrderFileDocumentType
) =>
  dt === ReportFileDocumentType.LIITO_ORAVA_ALUEET ||
  dt === ReportFileDocumentType.LIITO_ORAVA_PISTEET ||
  dt === ReportFileDocumentType.LIITO_ORAVA_VIIVAT ||
  dt === ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET ||
  dt === ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET ||
  dt === ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT ||
  dt === ReportFileDocumentType.LEPAKKO_ALUEET ||
  dt === ReportFileDocumentType.LEPAKKO_VIIVAT ||
  dt === ReportFileDocumentType.NORO_VIIVAT ||
  dt === ReportFileDocumentType.LUMO_ALUEET

export const FileInput = <
  T extends ReportFileDocumentType | OrderFileDocumentType
>({
  data,
  documentType,
  onChange,
  errors,
  noObservation = false,
  showTitle = true,
  readOnly = false,
  accept
}: FileInputProps<T>) => {
  const [file, setFile] = useState(data.file ?? null)
  const [description, setDescription] = useDebouncedState(data.description)
  const [noObs, setNoObs] = useState(noObservation)

  useEffect(() => {
    onChange({
      file,
      description,
      id: data.id,
      noObservation: noObs
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, description, noObs])

  const errorMessage = errors
    ? typeof errors === 'string'
      ? { text: [errors], status: 'warning' as const }
      : errors.length > 0
        ? {
            text: [
              'Tiedosto sisältää seuraavat virheet:',
              ...errors.map((e) => fileValidationErrorToMessage(e))
            ],
            status: 'warning' as const
          }
        : {
            text: ['Tiedoston tallennus epäonnistui'],
            status: 'warning' as const
          }
    : undefined

  const showNoObservationCheckBox = isReportFileNatureDocument(documentType)

  return (
    <FlexCol>
      <FlexRowWithGaps $gapSize="m" style={{ marginBottom: '5px' }}>
        <LabeledInput $cols={5}>
          {showTitle && (
            <>
              <FileTitle
                documentType={documentType}
                required={documentType !== ReportFileDocumentType.OTHER}
              />
            </>
          )}
          {showNoObservationCheckBox && (
            <Checkbox
              disabled={readOnly}
              label="Ei havaintoa"
              checked={noObs}
              onChange={(checked) => setNoObs(checked)}
              className={classNames({ dimmed: !noObs })}
            />
          )}
          <FileInputField
            readonly={noObservation}
            onChange={(fileList) => {
              const file = fileList?.[0]
              file && setFile(file)
            }}
            accept={accept}
          />
        </LabeledInput>

        <LabeledInput $cols={5}>
          {showTitle && <VerticalGap $size="L" />}
          <Label>Lisätiedot tarvittaessa</Label>
          <InputField
            readonly={readOnly || noObservation}
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
