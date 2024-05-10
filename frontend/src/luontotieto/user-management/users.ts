// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export interface User {
  id: string
  userName: string
  email: string
  active: boolean
  role: 'pääkäyttäjä' | 'tilaaja' | 'katsoja' | 'yrityskäyttäjä'
}
export const userlist: User[] = [
  {
    id: '1',
    userName: 'Taina Tilaaja',
    email: 'taina.tilaaja@espoo.fi',
    active: true,
    role: 'tilaaja'
  },
  {
    id: '2',
    userName: 'Kimmo Katsoja',
    email: 'kimmo.katsoja@espoo.fi',
    active: true,
    role: 'katsoja'
  },
  {
    id: '3',
    userName: 'Rambol Oy',
    email: 'rambol@konsultti.com',
    active: true,
    role: 'yrityskäyttäjä'
  },
  {
    id: '4',
    userName: 'SelvitysMestarit Oy',
    email: 'selvitys@mestarit.fi',
    active: true,
    role: 'yrityskäyttäjä'
  },
  {
    id: '5',
    userName: 'Oravat Oy',
    email: 'Oravat@liito.fi',
    active: false,
    role: 'yrityskäyttäjä'
  }
]
