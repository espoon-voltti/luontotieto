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
import { UserContext, hasOrdererRole, hasViewerRole } from 'auth/UserContext'
import React, { useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import InfoModal, { InfoModalActions } from 'shared/modals/InfoModal'
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
interface ShowModal extends InfoModalActions {
  title: string
  text?: string
}

export const ReportFormPage = React.memo(function ReportFormPage(props: Props) {
  const { user } = useContext(UserContext)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const userIsViewer = useMemo(() => hasViewerRole(user), [user])
  const showApproveButton = useMemo(() => hasOrdererRole(user), [user])

  if (!id && props.mode === 'EDIT') throw Error('Id not found in path')

  const [reportInput, setReportInput] = useState<ReportFormInput | null>(null)
  const [reportFileErrors, setReportFileErrors] = useState<
    FileValidationErrorResponse[] | undefined
  >(undefined)

  const { data: report, isLoading: isLoadingReport } = useGetReportQuery(id)
  const { data: reportFiles, isLoading: isLoadingReportFiles } =
    useGetReportFilesQuery(id)

  const [showModal, setShowModal] = useState<ShowModal | null>(null)

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
      onError: (error: FileValidationErrorResponse) =>
        setReportFileErrors([error])
    })

  const { mutateAsync: updateReportMutation, isPending: updatingReport } =
    useMutation({
      mutationFn: apiPutReport,
      onSuccess: (_report) => {
        void queryClient.invalidateQueries({ queryKey: ['report', id] })
        void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        setShowModal({
          title: 'Tiedot tallennettu',
          resolve: { action: () => setShowModal(null), label: 'Ok' }
        })
      },
      onError: (error: FileValidationErrorResponse) =>
        setReportFileErrors([error])
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
                  report?.approved
                }
                onClick={() => {
                  if (!reportInput) return
                  void onSubmit(reportInput)
                }}
              />
              {showApproveButton && (
                <Button
                  text="Hyväksy selvitys"
                  data-qa="approve-button"
                  primary
                  disabled={
                    !report || !reportInput || approving || report.approved
                  }
                  onClick={() => {
                    if (!report) return
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
                  }}
                />
              )}
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
