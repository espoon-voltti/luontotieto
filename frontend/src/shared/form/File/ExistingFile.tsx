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
import InfoModal from 'shared/modals/InfoModal'
import { I, Label } from 'shared/typography'

import { TextArea } from '../TextArea'

import FileDownloadButton from './FileDownloadButton'
import { FileTitle } from './FileTitle'
import useDownloadFile from './useDownloadFile'

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

  const downloadFunction =
    props.data.type === 'ORDER' ? apiGetOrderFileUrl : apiGetReportFileUrl

  const { downloadFile, acknowledgeError, errorMessage } =
    useDownloadFile(downloadFunction)

  const handleClick = async (fileId: string) => {
    if (props.data.type === 'ORDER') {
      await downloadFile(props.data.file.orderId, fileId)
    } else {
      await downloadFile(props.data.file.reportId, fileId)
    }
  }

  const showDescription =
    props.data.documentType ===
      ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS ||
    props.data.documentType === ReportFileDocumentType.OTHER ||
    props.data.documentType === OrderFileDocumentType.ORDER_INFO

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
            readonly={props.data.readonly}
          />
        </LabeledInput>
        {showDescription && (
          <LabeledInput $cols={5}>
            {showTitle && <VerticalGap $size="L" />}
            <Label>Lisätiedot tarvittaessa</Label>
            <TextArea
              value={props.data.file.description}
              readonly={props.data.readonly}
            />
          </LabeledInput>
        )}
      </FlexRowWithGaps>
      <FlexRowWithGaps>
        <I>{`Lisätty ${updatedStr}`}</I>
      </FlexRowWithGaps>
      {!!errorMessage && (
        <InfoModal
          close={() => acknowledgeError()}
          closeLabel="Sulje"
          title="Virhe ladattaessa tiedostoa"
          resolve={{
            action: () => {
              acknowledgeError()
            },
            label: 'Ok'
          }}
        >
          {errorMessage}
        </InfoModal>
      )}
    </FlexColWithGaps>
  )
})
