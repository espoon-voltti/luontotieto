// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  OrderFile,
  OrderFileDocumentType,
  apiGetOrderFileUrl
} from 'api/order-api'
import React from 'react'
import { FlexRowWithGaps, LabeledInput, VerticalGap } from 'shared/layout'
import FileDownloadButton from './FileDownloadButton'
import { Label } from 'shared/typography'
import { InputField } from '../InputField'
import {
  ReportFileDetails,
  ReportFileDocumentType,
  apiGetReportFileUrl
} from 'api/report-api'
import { FileTitle } from './FileTitle'

interface Props {
  data:
    | {
        type: 'ORDER'
        file: OrderFile
        readonly: boolean
        documentType: OrderFileDocumentType
      }
    | {
        type: 'REPORT'
        file: ReportFileDetails
        readonly: boolean
        documentType: ReportFileDocumentType
      }
  onRemove: (id: string) => void
}

export const ExistingFile = React.memo(function ExistingFile(props: Props) {
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
    <FlexRowWithGaps>
      <LabeledInput $cols={5}>
        <FileTitle
          documentType={props.data.documentType}
          required={true}
        ></FileTitle>
        <VerticalGap $size="s" />
        <FileDownloadButton
          file={props.data.file}
          onClick={handleClick}
          onDelete={(fileId) => props.onRemove(fileId)}
        />
      </LabeledInput>
      <LabeledInput $cols={5}>
        <Label>Liitteen kuvaus</Label>
        <InputField value={props.data.file.description} />
      </LabeledInput>
    </FlexRowWithGaps>
  )
})
