// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useMemo, useState } from 'react'
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
import { Label } from '../../shared/typography'
import { FileInput, FileInputData } from 'shared/FileInput'
import {
  ReportDetails,
  ReportFileDocumentType,
  ReportInput
} from 'api/report-api'

interface CreateProps {
  mode: 'CREATE'
  onChange: (validInput: ReportInput | null) => void
}
interface ViewProps {
  mode: 'VIEW'
  report: ReportDetails
}
interface EditProps {
  mode: 'EDIT'
  report: ReportDetails
  onChange: (validInput: ReportInput | null) => void
}
type Props = CreateProps | ViewProps | EditProps

export const ReportForm = React.memo(function ReportForm(props: Props) {
  const debounceDelay = 1500

  const [name, setName] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.name,
    debounceDelay
  )

  const [description, setDescription] = useDebouncedState(
    props.mode === 'CREATE' ? '' : props.report.description,
    debounceDelay
  )

  const [oravaPisteetFile, setOravaPisteetFile] = useState<
    FileInputData<ReportFileDocumentType>
  >({
    file: null,
    description: '',
    documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET
  })

  const validInput: ReportInput | null = useMemo(() => {
    if (name.trim() === '') return null
    if (description.trim() === '') return null

    const { file, description: fileDescription } = oravaPisteetFile
    if (file === null) return null
    if (fileDescription.trim() === '') return null

    return {
      name: name.trim(),
      description: description.trim(),
      files: [
        {
          file,
          description: fileDescription.trim(),
          documentType: ReportFileDocumentType.LIITO_ORAVA_PISTEET
        }
      ]
    }
  }, [name, description, oravaPisteetFile])

  useEffect(() => {
    if (props.mode !== 'VIEW') {
      props.onChange(validInput)
    }
  }, [validInput, props])

  return (
    <FlexCol>
      <GroupOfInputRows>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Selvityksen nimi</Label>
            {props.mode === 'VIEW' ? (
              <span>{props.report.name || '-'}</span>
            ) : (
              <InputField onChange={setName} value={name} />
            )}
          </LabeledInput>
        </RowOfInputs>
        <RowOfInputs>
          <LabeledInput $cols={4}>
            <Label>Selvityksen kuvaus</Label>
            {props.mode === 'VIEW' ? (
              <span>{props.report.description || '-'}</span>
            ) : (
              <TextArea
                onChange={setDescription}
                value={description}
                rows={2}
              />
            )}
          </LabeledInput>
        </RowOfInputs>
      </GroupOfInputRows>
      <VerticalGap $size="m" />
      <GroupOfInputRows>
        <FileInput
          data={oravaPisteetFile}
          onChange={(data) => setOravaPisteetFile(data)}
        />
      </GroupOfInputRows>

      <VerticalGap $size="XL" />
    </FlexCol>
  )
})
