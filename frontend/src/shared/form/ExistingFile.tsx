// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OrderFile } from 'api/order-api'
import { ReportFileDetails } from 'api/report-api'
import React from 'react'
import { Button } from 'shared/buttons/Button'
import { formatDate } from 'shared/dates'
import { FlexRowWithGaps, FlexCol } from 'shared/layout'
import styled from 'styled-components'

interface Props {
  file: OrderFile | ReportFileDetails
  onRemove: (id: string) => void
}

const CreatedFile = styled.div`
  padding: 10px;
  border-radius: 4px;
  border: 1px solid black;
`

export const ExistingFile = React.memo(function ExistingFile(props: Props) {
  return (
    <CreatedFile>
      <FlexRowWithGaps>
        <FlexCol>
          <div>
            <strong>Nimi:&nbsp;</strong>
            <code>{props.file.fileName}</code>
          </div>
        </FlexCol>
        <FlexCol>
          <div>
            <strong>Luotu:&nbsp;</strong>
            <code>{formatDate(props.file.created)}</code>
          </div>
        </FlexCol>
        <FlexCol>
          <div>
            <strong>Tyyppi:&nbsp;</strong>
            <code>{props.file.documentType}</code>
          </div>
        </FlexCol>
        <FlexCol>
          <Button text="Poista" onClick={() => props.onRemove(props.file.id)} />
        </FlexCol>
      </FlexRowWithGaps>
    </CreatedFile>
  )
})
