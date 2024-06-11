// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ReportDetails } from 'api/report-api'
import React, { useState } from 'react'
import { InfoBox } from 'shared/MessageBoxes'
import { Checkbox } from 'shared/form/Checkbox'

import { FlexCol, SectionContainer, VerticalGap } from '../../shared/layout'
import { H3 } from '../../shared/typography'

type Props = {
  report: ReportDetails
  onReopen: (reOpen: boolean) => void
}

export const ReportReOpen = React.memo(function ReportReopen({
  onReopen
}: Props) {
  const [reOpen, setReOpen] = useState(false)
  return (
    <SectionContainer>
      <FlexCol>
        <H3>Hyväksytyn selvityksen avaaminen</H3>
        <VerticalGap $size="m" />
        <Checkbox
          key="approve-report"
          label="Avaa luontoselvitys uudelleen"
          checked={reOpen}
          onChange={(checked) => {
            setReOpen(checked)
            onReopen(checked)
          }}
        />
        <VerticalGap $size="m" />
        {reOpen && (
          <InfoBox
            message={`Kun avaat hyväksytyn luontoselvityksen uudelleen,
             sekä tilaaja että selvityksen tehnyt konsulttiyritys voivat tehdä muutoksia selvityksen sisältöön.`}
          />
        )}
      </FlexCol>
    </SectionContainer>
  )
})
