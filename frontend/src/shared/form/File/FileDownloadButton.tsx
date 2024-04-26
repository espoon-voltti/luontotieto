// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import styled from 'styled-components'

import { FlexRow } from 'shared/layout'
import {
  faFile,
  faFileImage,
  faFilePdf,
  faFileWord
} from '@fortawesome/free-solid-svg-icons'
import { OrderFile } from 'api/order-api'
import { ReportFileDetails } from 'api/report-api'

export interface SavedFile {
  id: string
  mediaType: string
  fileName: string
}

export const fileIcon = (
  file: OrderFile | ReportFileDetails
): IconDefinition => {
  switch (file.mediaType) {
    case 'image/jpeg':
    case 'image/png':
      return faFileImage
    case 'application/pdf':
      return faFilePdf
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.oasis.opendocument.text':
      return faFileWord
    default:
      return faFile
  }
}

const DownloadButton = styled.button`
  background: #f7f7f7;
  border: none;
  color: #0047b6;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  width: 300px;
  justify-content: center;
`

interface FileDownloadButtonProps {
  file: OrderFile | ReportFileDetails
  onClick: (fileId: string) => void
  icon?: IconDefinition | boolean
  'data-qa'?: string
  text?: string
}

export default React.memo(function FileDownloadButton({
  file,
  icon,
  onClick,
  'data-qa': dataQa,
  text
}: FileDownloadButtonProps) {
  return (
    <DownloadButton onClick={() => onClick(file.id)} data-qa={dataQa}>
      <FlexRow>
        {icon && (
          <FontAwesomeIcon icon={icon === true ? fileIcon(file) : icon} />
        )}
        <div>{text ?? file.fileName}</div>
      </FlexRow>
    </DownloadButton>
  )
})
