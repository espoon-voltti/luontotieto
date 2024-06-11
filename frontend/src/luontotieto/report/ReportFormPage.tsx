// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGetReportFilesQuery, useGetReportQuery } from 'api/hooks/reports'
import {
  apiApproveReport,
  apiPostReport,
  apiPutReport,
  ReportFileValidationErrorResponse,
  ReportFormInput
} from 'api/report-api'
import { hasViewerRole, UserContext } from 'auth/UserContext'
import React, { useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import styled from 'styled-components'

import { NotFound } from '../../shared/404'
import {
  FlexRight,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'

import { OrderDetails } from './OrderDetails'
import { ReportApproval } from './ReportApproval'
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
  const { user } = useContext(UserContext)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const userIsViewer = useMemo(() => hasViewerRole(user), [user])
  const [approve, setApprove] = useState(false)

  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const [reportInput, setReportInput] = useState<ReportFormInput | null>(null)
  const [reportFileErrors, setReportFileErrors] = useState<
    ReportFileValidationErrorResponse[] | undefined
  >(undefined)

  const { data: report, isLoading: isLoadingReport } = useGetReportQuery(id)
  const { data: reportFiles, isLoading: isLoadingReportFiles } =
    useGetReportFilesQuery(id)

  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)

  const { mutateAsync: createReportMutation, isPending: savingReport } =
    useMutation({
      mutationFn: apiPostReport,
      onSuccess: (_report) => {
        void queryClient.invalidateQueries({ queryKey: ['report', id] })
        void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        setShowModal({
          title: 'Selvitys luotu',
          resolve: { action: () => setShowModal(null), label: 'Ok' }
        })
      },
      onError: (error: ReportFileValidationErrorResponse) =>
        setReportFileErrors([error])
    })

  const { mutateAsync: updateReportMutation, isPending: updatingReport } =
    useMutation({
      mutationFn: apiPutReport,
      onSuccess: (_report) => {
        void queryClient.invalidateQueries({ queryKey: ['report', id] })
        void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        setReportFileErrors([])
        setShowModal({
          title: 'Tiedot tallennettu',
          resolve: { action: () => setShowModal(null), label: 'Ok' }
        })
      },
      onError: (error: ReportFileValidationErrorResponse) => {
        setReportFileErrors([error])
        setShowModal({
          title: 'Tietojen tallennus epäonnistui',
          resolve: { action: () => setShowModal(null), label: 'Sulje' }
        })
      }
    })

  const { mutateAsync: approveReport, isPending: approving } = useMutation({
    mutationFn: apiApproveReport,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['report', id] })
      void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
      setShowModal({
        title: 'Selvitys hyväksytty',
        resolve: { action: () => setShowModal(null), label: 'Ok' }
      })
    }
  })

  const onSubmit = async (reportInput: ReportFormInput) => {
    if (props.mode === 'CREATE') {
      await createReportMutation(reportInput)
    } else {
      await updateReportMutation({ ...reportInput, reportId: id! })
    }
    if (report && approve) {
      setShowModal({
        title: 'Hyväksy selvitys',
        text: 'Selvityksen hyväksyminen lukitsee selvityksen ja tallentaa paikkatiedot paikkatietokantaan',
        resolve: {
          action: () => approveReport(report.id),
          label: 'Hyväksy'
        },
        reject: {
          action: () => setShowModal(null),
          label: 'Peruuta'
        }
      })
    }
  }

  if (isLoadingReport || isLoadingReportFiles) {
    return null
  }

  if (!report || !reportFiles) {
    return <NotFound />
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
              key={report.updated.toString()}
              readOnly={userIsViewer}
              mode={props.mode}
              onChange={setReportInput}
              report={report}
              reportFiles={reportFiles}
              saveErrors={reportFileErrors}
            />
          )}

          {props.mode === 'CREATE' && (
            <ReportForm
              readOnly={userIsViewer}
              mode={props.mode}
              onChange={setReportInput}
            />
          )}
        </SectionContainer>
        <VerticalGap $size="m" />
        {report && (
          <ReportApproval
            report={report}
            onApprove={setApprove}
            isValid={!!reportInput}
          />
        )}
      </PageContainer>
      <VerticalGap $size="XL" />
      <VerticalGap $size="XL" />
      <Footer>
        <FlexRight style={{ height: '100%' }}>
          {userIsViewer ? (
            <StyledButton
              text="Takaisin etusivulle"
              onClick={() => navigate(`/luontotieto`)}
            />
          ) : (
            <>
              <StyledButton
                text="Peruuta"
                onClick={() => navigate(`/luontotieto`)}
              />
              <StyledButton
                text="Tallenna muutokset"
                data-qa="save-button"
                primary
                disabled={
                  !reportInput ||
                  savingReport ||
                  updatingReport ||
                  report?.approved ||
                  approving
                }
                onClick={() => {
                  if (!reportInput) return
                  void onSubmit(reportInput)
                }}
              />
            </>
          )}
        </FlexRight>
      </Footer>
      {showModal && (
        <InfoModal
          close={() => setShowModal(null)}
          closeLabel="Sulje"
          title={showModal.title}
          resolve={showModal.resolve}
          reject={showModal.reject}
        >
          {showModal.text}
        </InfoModal>
      )}
    </>
  )
})
