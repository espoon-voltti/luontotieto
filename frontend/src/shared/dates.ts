// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { format, parse } from 'date-fns'

export const parseDate = (date: string) => {
  try {
    const parsed = parse(date, 'dd.MM.yyyy', new Date())
    if (Number.isNaN(parsed.valueOf())) return undefined

    return parsed
  } catch (e) {
    return undefined
  }
}

export const formatDate = (date: Date) => format(date, 'dd.MM.yyyy')

export const formatDateTime = (date: Date) => format(date, 'dd.MM.yyyy HH:mm')
