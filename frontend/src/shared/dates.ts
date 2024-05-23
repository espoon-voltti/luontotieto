// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { format as formatFn, parse } from 'date-fns'

export const parseDate = (date: string, format = 'dd.MM.yyyy') => {
  try {
    const parsed = parse(date, format, new Date())
    if (Number.isNaN(parsed.valueOf())) return undefined

    return parsed
  } catch (e) {
    return undefined
  }
}

export const formatDate = (date: Date, format = 'dd.MM.yyyy') =>
  formatFn(date, format)

export const formatDateTime = (date: Date) => formatFn(date, 'dd.MM.yyyy HH:mm')

export const DATE_PATTERN = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/g
