// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  apiGetOrderFileUrl,
  OrderFile,
  OrderFileDocumentType
} from 'api/order-api'
import {
  apiGetReportFileUrl,
  ReportFileDetails,
  ReportFileDocumentType
} from 'api/report-api'
import React, { useMemo } from 'react'
import { formatDate } from 'shared/dates'
import {
  FlexColWithGaps,
  FlexRowWithGaps,
  LabeledInput,
  VerticalGap
} from 'shared/layout'
import { I, Label } from 'shared/typography'

import { InputField } from '../InputField'

import FileDownloadButton from './FileDownloadButton'
import { FileTitle } from './FileTitle'

interface Props {
  data:
    | {
        type: 'ORDER'
        file: OrderFile
        readonly: boolean
        documentType: OrderFileDocumentType
        updated: Date
      }
    | {
        type: 'REPORT'
        file: ReportFileDetails
        readonly: boolean
        documentType: ReportFileDocumentType
        updated: Date
      }
  onRemove: (id: string) => void
  showTitle?: boolean
}

export const ExistingFile = React.memo(function ExistingFile({
  showTitle = true,
  ...props
}: Props) {
  const updatedStr = useMemo(() => formatDate(props.data.updated), [props])

  const handleClick = async (fileId: string) => {
    let url = ''
    if (props.data.type === 'ORDER') {
      url = await apiGetOrderFileUrl(props.data.file.orderId, fileId)
    } else {
      url = await apiGetReportFileUrl(props.data.file.reportId, fileId)
    }

    if (url) {
      window.open(url)
    }
  }
  return (
    <FlexColWithGaps>
      <FlexRowWithGaps>
        <LabeledInput $cols={5}>
          {showTitle && (
            <FileTitle documentType={props.data.documentType} required={true} />
          )}

          <VerticalGap $size="s" />
          <FileDownloadButton
            file={props.data.file}
            onClick={handleClick}
            onDelete={(fileId) => props.onRemove(fileId)}
          />
        </LabeledInput>
        <LabeledInput $cols={5}>
          {showTitle && <VerticalGap $size="L" />}
          <Label>Liitteen kuvaus</Label>
          <InputField value={props.data.file.description} />
        </LabeledInput>
      </FlexRowWithGaps>
      <FlexRowWithGaps>
        <I>{`Lisätty ${updatedStr}`}</I>
      </FlexRowWithGaps>
    </FlexColWithGaps>
  )
})
