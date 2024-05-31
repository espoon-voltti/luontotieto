// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiGetReportDocumentFileUrl } from 'api/report-api'
import React from 'react'
import { useParams } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

export const ReportDocumentPage = React.memo(function ReportDocumentPage() {
  const { id } = useParams()
  if (!id) {
    return null
  }

  const handleOrderFileClick = async (reportId: string) => {
    let url = ''
    url = await apiGetReportDocumentFileUrl(reportId)
    if (url) {
      window.open(url)
    }
  }

  return (
    <Button text="Lataa raportti" onClick={() => handleOrderFileClick(id)} />
  )
})
