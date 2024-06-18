// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useRef, useState } from 'react'
import styled from 'styled-components'

import { InputField } from './InputField'

interface Props {
  start?: string
  end?: string
  onChange: (data: { startDate: string; endDate: string }) => void
  disabled?: boolean
}
const StartDateInput = styled(InputField)`
  input[type='date']::-webkit-calendar-picker-indicator {
    display: none; /* Hides the icon in Chrome and Firefox < v109 */
  }

  input[type='date']::calendar-picker-indicator {
    display: none;
  }
`
const EndDateInput = styled(InputField)`
  width: 140px;
`

export const DateRange = React.memo(function DateRange({
  start,
  end,
  onChange
}: Props) {
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)

  const [startDate, setStartDate] = useState(start ?? '')
  const [endDate, setEndDate] = useState(end ?? '')

  const handleStartChange = (start: string) => {
    if (start && endDate) {
      if (start > endDate) {
        return
      }
    }
    setStartDate(start)
    onChange({ startDate: start, endDate })
  }

  const handleEndChange = (end: string) => {
    if (end && startDate) {
      if (end < startDate) {
        return
      }
    }
    setEndDate(end)
    onChange({ startDate, endDate: end })
  }
  return (
    <div>
      <StartDateInput
        inputRef={startDateInputRef}
        width="s"
        onChange={handleStartChange}
        value={startDate}
        type="date"
        onFocus={() => startDateInputRef.current?.showPicker()}
      />
      -
      <EndDateInput
        inputRef={endDateInputRef}
        width="s"
        onChange={handleEndChange}
        value={endDate}
        type="date"
        onFocus={() => endDateInputRef.current?.showPicker()}
      />
    </div>
  )
})
