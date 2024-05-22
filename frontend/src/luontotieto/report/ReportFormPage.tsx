// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGetReportFilesQuery, useGetReportQuery } from 'api/hooks/reports'
import {
  apiPostReport,
  ReportFormInput,
  apiPutReport,
  apiApproveReport,
  FileValidationErrorResponse
} from 'api/report-api'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import styled from 'styled-components'

import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'

import { OrderDetails } from './OrderDetails'
import { ReportForm } from './ReportForm'

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
  const queryClient = useQueryClient()
  const { id } = useParams()

  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const [reportInput, setReportInput] = useState<ReportFormInput | null>(null)
  const [reportFileErrors, setReportFileErrors] = useState<
    FileValidationErrorResponse[] | undefined
  >(undefined)

  const { data: report, isLoading: isLoadingReport } = useGetReportQuery(id)
  const { data: reportFiles, isLoading: isLoadingReportFiles } =
    useGetReportFilesQuery(id)

  const { mutateAsync: createReportMutation, isPending: savingReport } =
    useMutation({
      mutationFn: apiPostReport,
      onSuccess: (report) => {
        queryClient.invalidateQueries({ queryKey: ['report', id] })
        queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        navigate(`/luontotieto/selvitys/${report.id}`)
      },
      onError: (error: any) => setReportFileErrors([error])
    })

  const { mutateAsync: updateReportMutation, isPending: updatingReport } =
    useMutation({
      mutationFn: apiPutReport,
      onSuccess: (report) => {
        queryClient.invalidateQueries({ queryKey: ['report', id] })
        queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        navigate(`/luontotieto/selvitys/${report.id}`)
      },
      onError: (error: any) => setReportFileErrors([error])
    })

  const { mutateAsync: approveReport, isPending: approving } = useMutation({
    mutationFn: apiApproveReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
      alert('Hyväksytty ja tiedostot lähetetty PostGIS kantaan.')
    }
  })

  const onSubmit = async (reportInput: ReportFormInput) => {
    if (props.mode === 'CREATE') {
      await createReportMutation(reportInput)
    } else {
      await updateReportMutation({ ...reportInput, reportId: id! })
    }
  }

  if (isLoadingReport || isLoadingReportFiles || !report || !reportFiles) {
    return null
  }
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
            disabled={
              !reportInput || savingReport || updatingReport || report?.approved
            }
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
            onClick={async () => {
              if (!report) return
              await approveReport(report.id)
            }}
          />
        </FlexRight>
      </Footer>
    </>
  )
})
