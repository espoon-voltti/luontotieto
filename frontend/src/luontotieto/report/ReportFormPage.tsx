// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  ReportDetails,
  ReportInput,
  apiPostReport,
  apiGetReport,
  ReportFileDetails,
  apiGetReportFiles,
  ReportFormInput,
  apiPutReport
} from 'api/report-api'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'

import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H1 } from '../../shared/typography'

import { ReportForm } from './ReportForm'
import { Footer } from 'shared/Footer'

interface CreateProps {
  mode: 'CREATE'
}

interface EditProps {
  mode: 'EDIT'
}
type Props = CreateProps | EditProps

export const ReportFormPage = React.memo(function ReportFormPage(props: Props) {
  const navigate = useNavigate()
  const { id } = useParams()
  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')
  const [reportInput, setReportInput] = useState<ReportFormInput | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const [report, setReport] = useState<ReportDetails | null>(null)
  const [reportFiles, setReportFiles] = useState<ReportFileDetails[] | null>(
    null
  )

  const onSubmit = (reportInput: ReportFormInput) => {
    if (props.mode === 'CREATE') {
      setSubmitting(true)
      apiPostReport(reportInput)
        .then((report) => navigate(`/luontotieto/selvitys/${report.id}`))
        .catch(() => setSubmitting(false))
    } else {
      setSubmitting(true)
      apiPutReport(id!, reportInput)
        .then((report) => navigate(`/luontotieto/selvitys/${report.id}`))
        .catch(() => setSubmitting(false))
    }
  }

  useEffect(() => {
    if (props.mode === 'EDIT' && id) {
      void apiGetReport(id).then(setReport)
      void apiGetReportFiles(id).then(setReportFiles)
    }
  }, [props, id])

  const title =
    props.mode === 'CREATE' ? 'Uusi luontoselvitys' : report?.name ?? ''

  return (
    <>
      <PageContainer>
        <BackNavigation text={title} />
        <SectionContainer>
          <H1>Selvitys</H1>
          <VerticalGap $size="m" />
          {props.mode === 'EDIT' && report && reportFiles && (
            <ReportForm
              mode={props.mode}
              onChange={setReportInput}
              report={report}
              reportFiles={reportFiles}
            />
          )}

          {props.mode === 'CREATE' && (
            <ReportForm mode={props.mode} onChange={setReportInput} />
          )}
        </SectionContainer>
      </PageContainer>
      <VerticalGap $size="XL" />
      <Footer>
        <FlexRight style={{ height: '100%' }}>
          <Button
            text="Tallenna"
            data-qa="save-button"
            primary
            disabled={!reportInput || submitting}
            onClick={() => {
              if (!reportInput) return

              onSubmit(reportInput)
            }}
          />
        </FlexRight>
      </Footer>
    </>
  )
})
