// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { StaticChip } from 'shared/Chip'

import { colors } from '../../shared/theme'

export const StatusChip = React.memo(function StatusChip({
  approved
}: {
  approved: boolean
}) {
  return (
    <StaticChip
      $color={approved ? colors.status.success : colors.status.info}
      $textColor={colors.grayscale.g0}
      style={{ width: '180px', textAlign: 'center' }}
    >
      {approved ? 'Hyväksytty' : 'Avoin'}
    </StaticChip>
  )
})
