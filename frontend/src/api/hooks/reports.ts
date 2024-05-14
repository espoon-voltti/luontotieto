// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useQuery } from '@tanstack/react-query'
import { apiGetReport, apiGetReportFiles, apiGetReports } from 'api/report-api'

export function useGetReportsQuery() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => apiGetReports()
  })
}

export function useGetReportQuery(id?: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => {
      if (id) {
        return apiGetReport(id)
      }
      return null
    },
    enabled: !!id
  })
}

export function useGetReportFilesQuery(id?: string) {
  return useQuery({
    queryKey: ['reportFiles', id],
    queryFn: () => {
      if (id) {
        return apiGetReportFiles(id)
      }
      return null
    },
    enabled: !!id
  })
}
