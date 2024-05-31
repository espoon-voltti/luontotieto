// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiReportDocumentFileUrl } from 'api/report-api'
import React from 'react'
import { useParams } from 'react-router-dom'

export const ReportDocumentPage = React.memo(function ReportDocumentPage() {
  const { id } = useParams()
  if (!id) return null

  return (
    <a href={apiReportDocumentFileUrl(id)} download>
      Lataa
    </a>
  )
})
