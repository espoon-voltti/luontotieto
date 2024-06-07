// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faFile,
  faFileImage,
  faFilePdf,
  faFileWord,
  faX
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { OrderFile } from 'api/order-api'
import { ReportFileDetails } from 'api/report-api'
import React from 'react'
import { InlineButton } from 'shared/buttons/InlineButton'
import styled from 'styled-components'

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
  display: flex;
  justify-content: space-between;
  background: #f7f7f7;
  border: none;
  color: #0047b6;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  padding: 20px;
  text-align: center;
  text-decoration: none;
`

const FileName = styled.div`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  padding-right: 16px;
`

interface FileDownloadButtonProps {
  file: OrderFile | ReportFileDetails
  onClick: (fileId: string) => void
  onDelete: (fileId: string) => void
  icon?: IconDefinition | boolean
  'data-qa'?: string
  text?: string
}

export default React.memo(function FileDownloadButton({
  file,
  icon,
  onClick,
  onDelete,
  'data-qa': dataQa,
  text
}: FileDownloadButtonProps) {
  return (
    <DownloadButton onClick={() => onClick(file.id)} data-qa={dataQa}>
      {icon && <FontAwesomeIcon icon={icon === true ? fileIcon(file) : icon} />}
      <FileName title={text ?? file.fileName}>{text ?? file.fileName}</FileName>
      <InlineButton
        text="Poista"
        icon={faX}
        onClick={() => {
          onDelete(file.id)
        }}
        stopPropagation={true}
      />
    </DownloadButton>
  )
})
