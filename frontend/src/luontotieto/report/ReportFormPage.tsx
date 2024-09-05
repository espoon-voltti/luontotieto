// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGetReportFilesQuery, useGetReportQuery } from 'api/hooks/reports'
import {
  apiApproveReport,
  apiPutReport,
  apiReOpenReport,
  ApproveReportError,
  ReportFileSuccessResponse,
  ReportFileValidationErrorResponse,
  ReportFormInput,
  getDocumentTypeTitle
} from 'api/report-api'
import { UserRole } from 'api/users-api'
import { hasViewerRole, UserContext } from 'auth/UserContext'
import React, { useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Footer } from 'shared/Footer'
import { AlertBox } from 'shared/MessageBoxes'
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
import { ReportReOpen } from './ReportReOpen'

const StyledButton = styled(Button)`
  margin-right: 20px;
`

export const ReportFormPage = React.memo(function ReportFormPage() {
  const { user } = useContext(UserContext)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const userIsViewer = useMemo(() => hasViewerRole(user), [user])
  const [approve, setApprove] = useState(false)
  const [reOpen, setReOpen] = useState(false)
  const [overrideReportName, setOverrideReportName] = useState(false)

  if (!id) throw Error('Id not found in path')

  const [reportInput, setReportInput] = useState<ReportFormInput | null>(null)
  const [reportFileErrors, setReportFileErrors] = useState<
    ReportFileValidationErrorResponse[] | undefined
  >(undefined)

  const { data: report, isLoading: isLoadingReport } = useGetReportQuery(id)
  const { data: reportFiles, isLoading: isLoadingReportFiles } =
    useGetReportFilesQuery(id)

  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)

  const closeModal = () => {
    setShowModal(null)
    setApproveError(null)
    setOverrideReportName(false)
  }

  const { mutateAsync: updateReportMutation, isPending: updatingReport } =
    useMutation({
      mutationFn: apiPutReport,
      onSuccess: (_report) => {
        setReportFileErrors([])
        setShowModal({
          title: 'Tiedot tallennettu',
          resolve: {
            action: async () => {
              void queryClient.invalidateQueries({ queryKey: ['report', id] })
              void queryClient.invalidateQueries({
                queryKey: ['reportFiles', id]
              })
              closeModal()
              navigate(`/luontotieto`)
            },
            label: 'Ok'
          }
        })
      },
      onError: (
        responses: (
          | ReportFileSuccessResponse
          | ReportFileValidationErrorResponse
        )[]
      ) => {
        // void queryClient.invalidateQueries({ queryKey: ['report', id] })
        void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
        const errors = responses.flatMap((r) => {
          if (r.type === 'error') {
            return [r satisfies ReportFileValidationErrorResponse]
          }
          return []
        })
        errors && setReportFileErrors(errors)

        setShowModal({
          title: 'Tietojen tallennus epäonnistui',
          text: `Seuravien tiedostojen tallennus epäonnistui: ${errors
            .map(
              (e) => `${getDocumentTypeTitle(e.documentType)}:${e.name} \r\n`
            )
            .join(',')}`,
          resolve: {
            action: () => closeModal(),
            label: 'Sulje'
          }
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
        resolve: {
          action: () => closeModal(),
          label: 'Ok'
        }
      })
    },
    onError: (error: ApproveReportError) => {
      if (error?.errorCode === 'error-saving-paikkatieto-data') {
        setApproveError('Virhe tallentaessa paikkatietoja paikkatietokantaan.')
      } else {
        setApproveError('Virhe hyväksyttäessä selvitystä')
      }
    }
  })

  const { mutateAsync: reOpenReport, isPending: reOpening } = useMutation({
    mutationFn: apiReOpenReport,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['report', id] })
      void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
      setShowModal({
        title: 'Selvitys avattu uudelleen',
        resolve: {
          action: () => {
            closeModal()

            navigate(0)
          },
          label: 'Ok'
        }
      })
    }
  })

  const onSubmit = async (reportInput: ReportFormInput) => {
    if (report && report.approved && reOpen) {
      setShowModal({
        title: 'Avaa selvitys uudelleen',
        text: 'Selvityksen avaaminen poistaa kaikki tallennetut tiedot paikkatietokannasta, oletko varma?',
        resolve: {
          action: () => reOpenReport(report.id),
          label: 'Hyväksy'
        },
        reject: {
          action: () => closeModal(),
          label: 'Peruuta'
        }
      })
      return
    }

    await updateReportMutation({ ...reportInput, reportId: id })

    if (report && approve) {
      setShowModal({
        title: 'Hyväksy selvitys',
        text: 'Selvityksen hyväksyminen lukitsee selvityksen ja tallentaa paikkatiedot paikkatietokantaan',
        resolve: {
          action: () =>
            approveReport({ reportId: report.id, overrideReportName }),
          label: 'Hyväksy'
        },
        reject: {
          action: () => closeModal(),
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

  const title = report?.approved
    ? `${report.order.name} (Hyväksytty)`
    : report.order.name

  const showReportReOpen =
    user?.role === UserRole.ADMIN && report && report.approved

  return (
    <>
      <PageContainer>
        <BackNavigation text={title} navigationText="Etusivulle" />
        <OrderDetails order={report.order} reportId={report.id} />

        <VerticalGap $size="m" />

        <SectionContainer>
          <ReportForm
            key={report.updated.toString()}
            readOnly={userIsViewer}
            onChange={setReportInput}
            report={report}
            reportFiles={reportFiles}
            saveErrors={reportFileErrors}
          />
        </SectionContainer>
        <VerticalGap $size="m" />
        {report && (
          <ReportApproval
            report={report}
            onApprove={setApprove}
            isValid={!!reportInput}
            onOverrideReportName={setOverrideReportName}
          />
        )}
        <VerticalGap $size="m" />
        {showReportReOpen && (
          <ReportReOpen report={report} onReopen={setReOpen} />
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
                  !reOpen &&
                  (!reportInput ||
                    updatingReport ||
                    report?.approved ||
                    approving ||
                    reOpening)
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
          close={() => closeModal()}
          closeLabel="Sulje"
          title={showModal.title}
          resolve={showModal.resolve}
          reject={showModal.reject}
          disabled={approving}
        >
          {showModal.text}
          {!!approveError && (
            <>
              <VerticalGap $size="L" />
              <AlertBox title="Virhe" message={approveError} />
            </>
          )}
        </InfoModal>
      )}
    </>
  )
})
