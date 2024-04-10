// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ReportInput, apiPostReport } from 'api'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H1 } from '../../shared/typography'

import { ReportForm } from './ReportForm'

interface CreateProps {
  mode: 'CREATE'
}

interface EditProps {
  mode: 'EDIT'
  reportId: string
}
type Props = CreateProps | EditProps

export const CreateReportPage = React.memo(function CreateReportPage(
  props: Props
) {
  const navigate = useNavigate()
  const [reportInput, setReportInput] = useState<ReportInput | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  console.log(reportInput)

  return (
    <PageContainer>
      <SectionContainer>
        <H1>Selvitys</H1>
        <VerticalGap $size="m" />
        {props.mode == 'CREATE' && (
          <ReportForm mode="CREATE" onChange={setReportInput} />
        )}
        <VerticalGap />
        <FlexRight>
          <Button
            text="Tallenna"
            data-qa="save-button"
            primary
            disabled={!reportInput || submitting}
            onClick={() => {
              if (!reportInput) return

              setSubmitting(true)
              apiPostReport(reportInput)
                .then((report) =>
                  navigate(`/luontotieto/selvitys/${report.id}`)
                )
                .catch(() => setSubmitting(false))
            }}
          />
        </FlexRight>
      </SectionContainer>
    </PageContainer>
  )
})
