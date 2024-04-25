// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import { ReportList } from './report/ReportList'

export const FrontPage = React.memo(function FrontPage() {
  return <ReportList />
})
