// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { AxiosError } from 'axios'
import { useCallback, useState } from 'react'

const useDownloadFile = (
  download: (entityId: string, fileUrl: string) => Promise<string>
) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const acknowledgeError = useCallback(() => {
    setErrorMessage(null) // Reset error message
  }, [])

  const downloadFile = async (entityId: string, fileUrl: string) => {
    try {
      const url = await download(entityId, fileUrl) // Use the custom download function
      setErrorMessage(null) // Clear any previous error messages
      window.open(url)
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const errorMessage =
          (err as AxiosError<{ errorCode?: string }>).response?.data
            ?.errorCode === 'access-denied'
            ? 'Tiedosto ei ole vielä ladattavissa, koska taustalla suoritettava virustarkistus on todennäköisesti vielä kesken. Yritä hetken kuluttua uudelleen.'
            : 'Tiedoston lataamisessa tapahtui odottamon virhe.'
        setErrorMessage(errorMessage)
      }
    }
  }

  return { downloadFile, acknowledgeError, errorMessage }
}

export default useDownloadFile
