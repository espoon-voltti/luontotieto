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
      //TODO: a bit hacky find out if theres better way to pass conditional params
      // the enabled param should however prevent that this will not fire without the id
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
