// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ReportDetails } from 'api/report-api'
import { UserContext, hasOrdererRole } from 'auth/UserContext'
import React, { useContext, useMemo, useState } from 'react'
import { formatDateTime } from 'shared/dates'
import { Checkbox } from 'shared/form/Checkbox'
import { colors } from 'shared/theme'

import {
  FlexCol,
  FlexRowWithGaps,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { B, H3 } from '../../shared/typography'
import { UserRole } from 'api/users-api'

type Props = {
  report: ReportDetails
  isValid: boolean
  onApprove: (approved: boolean) => void
  onOverrideReportName: (approved: boolean) => void
}

export const ReportApproval = React.memo(function ReportApproval({
  report,
  isValid,
  onApprove,
  onOverrideReportName
}: Props) {
  const { user } = useContext(UserContext)
  const showApproveButton = useMemo(
    () => isValid && hasOrdererRole(user) && !report.approved,
    [user, report.approved, isValid]
  )

  const [approved, setApproved] = useState(report.approved)
  const [overrideReportName, setOverrideReportName] = useState(false)

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
          <B>
            <FontAwesomeIcon
              icon={faCheckCircle}
              color={colors.status.success}
              style={{ marginRight: '6px' }}
            />
            {`Selvitys hyväksytty ${formatDateTime(report.updated)}, ${report.updatedBy}`}
          </B>
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
        </FlexRowWithGaps>
      </FlexCol>
    </SectionContainer>
  )
})
