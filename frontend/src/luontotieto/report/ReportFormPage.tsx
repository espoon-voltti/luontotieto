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
import { AsyncButton } from 'shared/buttons/AsyncButton'
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

  const onUpdateReportSuccess = () => {
    setReportFileErrors([])
    setShowModal({
      title: 'Tiedot tallennettu',
      resolve: {
        action: async () => {
          await queryClient.invalidateQueries({ queryKey: ['report', id] })
          await queryClient.invalidateQueries({
            queryKey: ['reportFiles', id]
          })
          closeModal()
          navigate(`/luontotieto`)
        },
        label: 'Ok'
      }
    })
  }

  const { mutateAsync: updateReportMutation } = useMutation({
    mutationFn: apiPutReport,
    onSuccess: onUpdateReportSuccess,
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
          .map((e) => `${getDocumentTypeTitle(e.documentType)}:${e.name} \r\n`)
          .join(',')}`,
        resolve: {
          action: () => closeModal(),
          label: 'Sulje'
        }
      })
    }
  })

  const onApproveSuccess = () => {
    setApprove(false)
    void queryClient.invalidateQueries({ queryKey: ['report', id] })
    void queryClient.invalidateQueries({ queryKey: ['reportFiles', id] })
    setShowModal({
      title: 'Selvitys hyväksytty',
      resolve: {
        action: () => closeModal(),
        label: 'Ok'
      }
    })
  }

  const { mutateAsync: approveReport, isPending: approving } = useMutation({
    mutationFn: apiApproveReport,
    onSuccess: () => onApproveSuccess,
    onError: (error: ApproveReportError) => {
      if (error?.errorCode === 'error-saving-paikkatieto-data') {
        setApproveError('Virhe tallentaessa paikkatietoja paikkatietokantaan.')
      } else if (error?.errorCode === 'error-validating-paikkatieto-data') {
        if (error.errorMessages && error.errorMessages.length > 0) {
          setApproveError(
            'Tiedostoista löytyi seuraavat virheet: \r\n' +
              error?.errorMessages.join('\r\n')
          )
        } else {
          setApproveError('Virhe selvityksen tiedostojen validoinnissa')
        }
      } else if (error?.errorCode === 'access-denied') {
        setApproveError(
          'Hyväksyminen epäonnistui koska taustalla suoritettava tiedostojen virustarkistus on todennäköisesti vielä kesken. Yritä hetken kuluttua uudelleen.'
        )
      } else {
        setApproveError('Virhe hyväksyttäessä selvitystä')
      }
    }
  })

  const onReopenSuccess = () => {
    setReOpen(false)
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

  const { mutateAsync: reOpenReport } = useMutation({
    mutationFn: apiReOpenReport,
    onSuccess: () => onReopenSuccess
  })

  const onSaveReport = (reportInput: ReportFormInput) => {
    setApproveError(null)
    return updateReportMutation({ ...reportInput, reportId: id })
  }

  const onApproveReport = async (reportInput: ReportFormInput) => {
    setApproveError(null)
    await updateReportMutation({
      ...reportInput,
      reportId: id,
      sendUpdatedEmail: false
    })

    if (report && approve) {
      setShowModal({
        title: 'Hyväksy selvitys',
        text: 'Selvityksen hyväksyminen lukitsee selvityksen ja tallentaa paikkatiedot paikkatietokantaan',
        resolve: {
          action: () =>
            approveReport({ reportId: report.id, overrideReportName }),
          onSuccess: onApproveSuccess,
          label: 'Hyväksy'
        },
        reject: {
          action: () => closeModal(),
          label: 'Peruuta'
        }
      })
    }
  }

  const onReopenReport = async (reportInput: ReportFormInput) => {
    setApproveError(null)
    await updateReportMutation({
      ...reportInput,
      reportId: id,
      sendUpdatedEmail: false
    })
    if (report && report.approved && reOpen) {
      setShowModal({
        title: 'Avaa selvitys uudelleen',
        text: 'Selvityksen avaaminen poistaa kaikki tallennetut tiedot paikkatietokannasta, oletko varma?',
        resolve: {
          action: () => reOpenReport(report.id),
          onSuccess: onReopenSuccess,
          label: 'Hyväksy'
        },
        reject: {
          action: () => closeModal(),
          label: 'Peruuta'
        }
      })
      return
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
              {!reOpen && !approve && (
                <AsyncButton
                  text="Tallenna muutokset"
                  data-qa="save-button"
                  primary
                  disabled={!reportInput || report?.approved}
                  onSuccess={onUpdateReportSuccess}
                  onClick={() => onSaveReport(reportInput!)}
                />
              )}
              {reOpen && (
                <AsyncButton
                  text="Tallenna muutokset"
                  data-qa="save-button"
                  primary
                  disabled={!reportInput || !report?.approved}
                  onSuccess={() => {
                    /* intentionally empty */
                  }}
                  onClick={() => onReopenReport(reportInput!)}
                />
              )}
              {approve && (
                <AsyncButton
                  text="Tallenna muutokset"
                  data-qa="save-button"
                  primary
                  disabled={!reportInput || report?.approved}
                  onSuccess={() => {
                    /* intentionally empty */
                  }}
                  onClick={() => onApproveReport(reportInput!)}
                />
              )}
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
