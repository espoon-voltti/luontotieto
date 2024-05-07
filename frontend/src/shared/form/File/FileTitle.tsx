// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderFileDocumentType } from 'api/order-api'
import React from 'react'

import { Label } from 'shared/typography'
import {
  ReportFileDocumentType,
  apiGetReportDocumentTypeFileTemplate,
  getDocumentTypeTitle
} from 'api/report-api'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

interface Props {
  documentType: ReportFileDocumentType | OrderFileDocumentType
  required: boolean
}

const isReportFileDocumentType = (
  documentType: ReportFileDocumentType | OrderFileDocumentType
): documentType is ReportFileDocumentType => {
  return Object.values(ReportFileDocumentType).includes(
    documentType as ReportFileDocumentType
  )
}

export const StyledLink = styled.a`
  font-weight: 600;
  margin-left: 30px;
`

export const FileTitle = React.memo(function FileTitle(props: Props) {
  return (
    <Label>
      {`${getDocumentTypeTitle(props.documentType)} ${props.required ? '*' : ''}`}
      {isReportFileDocumentType(props.documentType) &&
        props.documentType !== ReportFileDocumentType.OTHER && (
          <StyledLink
            onClick={() =>
              apiGetReportDocumentTypeFileTemplate(
                props.documentType as ReportFileDocumentType
              )
            }
          >
            <FontAwesomeIcon
              icon={faDownload}
              style={{ marginRight: '10px' }}
            />
            Lataa Pohja
          </StyledLink>
        )}
    </Label>
  )
})
