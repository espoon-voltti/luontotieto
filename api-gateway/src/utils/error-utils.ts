// SPDX-FileCopyrightText: 2023-2025 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))
