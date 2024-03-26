// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMemo } from 'react'

let nextId = 1

export function useUniqueId(): string {
  return useMemo(() => `generated-id-${nextId++}`, [])
}
