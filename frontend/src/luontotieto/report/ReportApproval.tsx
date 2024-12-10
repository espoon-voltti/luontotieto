// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheckCircle, faEuroSign } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReportDetails } from 'api/report-api'
import { UserRole } from 'api/users-api'
import { UserContext, hasOrdererRole } from 'auth/UserContext'
import React, { useContext, useMemo, useState } from 'react'
import { InfoBox } from 'shared/MessageBoxes'
import { InfoButton } from 'shared/buttons/InfoButton'
import { formatDateTime } from 'shared/dates'
import { Checkbox } from 'shared/form/Checkbox'
import { InputField } from 'shared/form/InputField'
import { colors } from 'shared/theme'

import {
  FlexCol,
  FlexRow,
  FlexRowWithGaps,
  LabeledInput,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { B, H3, Label, P } from '../../shared/typography'

type Props = {
  report: ReportDetails
  isValid: boolean
  onApprove: (approved: boolean) => void
  onOverrideReportName: (approved: boolean) => void
  onCostChange: (cost: string) => void
}

export const ReportApproval = React.memo(function ReportApproval({
  report,
  isValid,
  onApprove,
  onOverrideReportName,
  onCostChange
}: Props) {
  const { user } = useContext(UserContext)
  const showApproveButton = useMemo(
    () => isValid && hasOrdererRole(user) && !report.approved,
    [user, report.approved, isValid]
  )

  const [reportCost, setReportCost] = useState(report.cost ?? '')

  const [approved, setApproved] = useState(report.approved)
  const [overrideReportName, setOverrideReportName] = useState(false)
  const [showReportCostInfo, setShowReportCostInfo] = useState(false)

  const handleCostChange = (value: string) => {
    // Ensure valid monetary format
    if (/^\d{0,18}(\.\d{0,2})?$/.test(value)) {
      setReportCost(value)
      onCostChange(value)
    }
  }
  return (
    <SectionContainer>
      <FlexCol>
        <H3>Selvityksen hyväksyminen</H3>
        <VerticalGap $size="m" />
        <B>
          {`Tilaus lähetetty ${formatDateTime(report.order.created)}, ${report.order.createdBy}`}
        </B>
        <VerticalGap $size="m" />
        {report.approved && (
          <>
            <B>
              <FontAwesomeIcon
                icon={faCheckCircle}
                color={colors.status.success}
                style={{ marginRight: '6px' }}
              />
              {`Selvitys hyväksytty ${formatDateTime(report.updated)}, ${report.updatedBy}`}
            </B>
            {!!report.cost && (
              <>
                <VerticalGap $size="m" />
                <B>
                  <FontAwesomeIcon
                    icon={faEuroSign}
                    color={colors.status.success}
                    style={{ marginRight: '12px' }}
                  />
                  {`Selvityksen toteutunut hinta ${report.cost} €`}
                </B>
              </>
            )}
          </>
        )}
        <VerticalGap $size="m" />
        <FlexRowWithGaps $gapSize="L">
          {showApproveButton && (
            <Checkbox
              disabled={report.approved}
              key="approve-report"
              label="Hyväksy selvitys"
              checked={approved}
              onChange={(checked) => {
                setApproved(checked)
                onApprove(checked)
              }}
            />
          )}
          {showApproveButton && user?.role === UserRole.ADMIN && (
            <Checkbox
              disabled={report.approved}
              key="override-report-name"
              label="Ylikirjoita viitesarake"
              checked={overrideReportName}
              onChange={(checked) => {
                setOverrideReportName(checked)
                onOverrideReportName(checked)
              }}
            />
          )}

          {showApproveButton &&
            user?.role === UserRole.ADMIN &&
            overrideReportName && (
              <>
                <VerticalGap $size="m" />{' '}
                <InfoBox
                  message={
                    <P>
                      {`Jos ylikirjoita viitesarake valintaruutu on valittuna, 
                  kirjoitetaan paikkatietokantaan selvityksen nimen sijasta tiedostosta löytyvä viite.`}
                    </P>
                  }
                />
              </>
            )}
          {showApproveButton && (
            <LabeledInput $cols={4}>
              <FlexRow>
                <Label>Selvityksen hinta </Label>
                <InfoButton
                  onClick={() => setShowReportCostInfo(!showReportCostInfo)}
                />
              </FlexRow>
              {showReportCostInfo && (
                <InfoBox
                  message={
                    <P>
                      Selvityksen toteutunut kokonaishinta euroissa ilman alvia.
                    </P>
                  }
                />
              )}
              <InputField
                readonly={report.approved}
                type="text"
                onChange={(value) => handleCostChange(value)}
                value={reportCost}
              />
            </LabeledInput>
          )}
        </FlexRowWithGaps>
      </FlexCol>
    </SectionContainer>
  )
})
