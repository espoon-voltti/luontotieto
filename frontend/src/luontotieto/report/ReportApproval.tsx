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
import styled from 'styled-components'

import { FlexCol, SectionContainer, VerticalGap } from '../../shared/layout'
import { H3, P } from '../../shared/typography'

type Props = {
  report: ReportDetails
  isValid: boolean
  onApprove: (approved: boolean) => void
}

export const ReportApproval = React.memo(function ReportApproval({
  report,
  isValid,
  onApprove
}: Props) {
  const { user } = useContext(UserContext)
  const showApproveButton = useMemo(
    () => isValid && hasOrdererRole(user) && !report.approved,
    [user, report.approved, isValid]
  )

  const [approved, setApproved] = useState(report.approved)
  return (
    <SectionContainer>
      <FlexCol>
        <H3>Selvityksen hyväksyminen</H3>
        <VerticalGap $size="m" />
        <StyledP>
          {`Tilaus lähetetty ${formatDateTime(report.order.created)}, ${report.order.createdBy}`}
        </StyledP>
        <VerticalGap $size="m" />
        {report.approved && (
          <StyledP>
            <FontAwesomeIcon
              icon={faCheckCircle}
              color={colors.status.success}
              style={{ marginRight: '6px' }}
            />
            {`Selvitys hyväksytty ${formatDateTime(report.updated)}, ${report.updatedBy}`}
          </StyledP>
        )}
        <VerticalGap $size="m" />
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
      </FlexCol>
    </SectionContainer>
  )
})

const StyledP = styled(P)`
  font-weight: bold;
`
