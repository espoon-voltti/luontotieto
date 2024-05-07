// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  ReportDetails,
  apiPostReport,
  apiGetReport,
  ReportFileDetails,
  apiGetReportFiles,
  ReportFormInput,
  apiPutReport,
  apiApproveReport,
  FileValidationErrorResponse
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

import { ReportForm } from './ReportForm'
import { Footer } from 'shared/Footer'
import { OrderDetails } from './OrderDetails'
import styled from 'styled-components'

interface CreateProps {
  mode: 'CREATE'
}

interface EditProps {
  mode: 'EDIT'
}
type Props = CreateProps | EditProps

const StyledButton = styled(Button)`
  margin-right: 20px;
`

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
  const [reportFileErrors, setReportFileErrors] = useState<
    FileValidationErrorResponse[] | undefined
  >(undefined)

  const [approving, setApproving] = useState<boolean>(false)

  const onSubmit = (reportInput: ReportFormInput) => {
    if (props.mode === 'CREATE') {
      setSubmitting(true)
      apiPostReport(reportInput)
        .then((report) => navigate(`/luontotieto/selvitys/${report.id}`))
        .catch((e) => {
          setReportFileErrors([e])
          setSubmitting(false)
        })
    } else {
      setSubmitting(true)
      apiPutReport(id!, reportInput)
        .then((report) => navigate(`/luontotieto/selvitys/${report.id}`))
        .catch((e) => {
          setReportFileErrors([e])
          setSubmitting(false)
        })
    }
  }

  useEffect(() => {
    if (props.mode === 'EDIT' && id) {
      void apiGetReport(id).then(setReport)
      void apiGetReportFiles(id).then(setReportFiles)
    }
  }, [props, id])

  const title =
    props.mode === 'CREATE'
      ? 'Uusi luontoselvitys'
      : report?.order
        ? report.order.name
        : report?.approved
          ? `${report?.name} (Hyväksytty)`
          : report?.name ?? ''

  return (
    <>
      <PageContainer>
        <BackNavigation text={title} navigationText="Etusivulle" />
        {report?.order && (
          <OrderDetails order={report?.order} reportId={report.id} />
        )}
        <VerticalGap $size="m" />

        <SectionContainer>
          {props.mode === 'EDIT' && report && reportFiles && (
            <ReportForm
              mode={props.mode}
              onChange={setReportInput}
              report={report}
              reportFiles={reportFiles}
              saveErrors={reportFileErrors}
            />
          )}

          {props.mode === 'CREATE' && (
            <ReportForm mode={props.mode} onChange={setReportInput} />
          )}
        </SectionContainer>
      </PageContainer>
      <VerticalGap $size="XL" />
      <VerticalGap $size="XL" />
      <Footer>
        <FlexRight style={{ height: '100%' }}>
          <StyledButton
            text="Tallenna"
            data-qa="save-button"
            primary
            disabled={!reportInput || submitting || report?.approved}
            onClick={() => {
              if (!reportInput) return

              onSubmit(reportInput)
            }}
          />

          <Button
            text="Hyväksy"
            data-qa="approve-button"
            primary
            disabled={!report || !reportInput || approving || report.approved}
            onClick={() => {
              if (!report) return

              setApproving(true)
              apiApproveReport(report.id)
                .then(() =>
                  alert('Hyväksytty ja tiedostot lähetetty PostGIS kantaan.')
                )
                .catch(() => setApproving(false))
            }}
          />
        </FlexRight>
      </Footer>
    </>
  )
})
