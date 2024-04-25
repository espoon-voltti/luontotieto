// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderFile, apiGetOrderFileUrl } from 'api/order-api'
import React from 'react'
import { FlexRowWithGaps, FlexCol, LabeledInput } from 'shared/layout'
import FileDownloadButton from './FileDownloadButton'
import { faX } from '@fortawesome/free-solid-svg-icons'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Label } from 'shared/typography'
import { InputField } from './InputField'
import { ReportFileDetails, apiGetReportFileUrl } from 'api/report-api'

interface Props {
  data:
    | { type: 'ORDER'; file: OrderFile; readonly: boolean }
    | { type: 'REPORT'; file: ReportFileDetails; readonly: boolean }
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
      <FlexCol>
        <FileDownloadButton file={props.data.file} onClick={handleClick} />
      </FlexCol>
      <FlexCol style={{ marginRight: 60 }}>
        <InlineButton
          icon={faX}
          text={'Poista'}
          onClick={() => props.onRemove(props.data.file.id)}
          disabled={props.data.readonly}
        />
      </FlexCol>
      <FlexCol>
        <LabeledInput>
          <Label>Liitteen kuvaus</Label>
          <InputField readonly={true} value={props.data.file.description} />
        </LabeledInput>
      </FlexCol>
    </FlexRowWithGaps>
  )
})
