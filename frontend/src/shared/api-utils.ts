// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type JsonOf<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends Date
    ? string
    : T extends Map<string, infer U>
      ? { [key: string]: JsonOf<U> }
      : T extends Set<infer U>
        ? JsonOf<U>[]
        : T extends (infer U)[]
          ? JsonOf<U>[]
          : T extends object
            ? { [P in keyof T]: JsonOf<T[P]> }
            : never
