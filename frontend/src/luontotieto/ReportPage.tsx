// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPostAnonymousLogin } from 'api/auth-api'
import { apiGetReportDocumentFileUrl } from 'api/report-api'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from 'shared/buttons/Button'

export const ReportDocumentPage = React.memo(function ReportDocumentPage() {
  const { id } = useParams()
  const [success, setSuccess] = useState(false)
  const { mutateAsync: loginMutation } = useMutation({
    mutationFn: apiPostAnonymousLogin,
    onSuccess: (success: boolean) => {
      if (success) {
        setSuccess(true)
      } else {
        alert('ei onnistunu hei')
      }
    },
    onError: () => setSuccess(false)
  })

  const handleOrderFileClick = async (reportId: string) => {
    let url = ''
    url = await apiGetReportDocumentFileUrl(reportId)
    console.log(url)
    if (url) {
      window.open(url)
    }
  }
  return (
    <>
      <Button text="Kirjaudu hei" onClick={async () => await loginMutation()} />
      {!!id && success && (
        <Button
          text="Lataa raportti"
          onClick={() => handleOrderFileClick(id)}
        />
      )}
    </>
  )
})
