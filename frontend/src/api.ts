// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { JsonOf } from 'shared/api-utils'

export interface ReportInput {
  name: string
  description: string
  files: ReportFileInput[]
}

export enum ReportFileDocumentType {
  LIITO_ORAVA_PISTEET,
  LIITO_ORAVA_ALUEET
}

export interface ReportFileInput {
  description: string
  documentType: ReportFileDocumentType
  file: File
}

export interface ReportDetails extends ReportInput {
  id: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
  approved: boolean
}

export interface ReportFileDetails extends ReportFileInput {
  id: string
  mediaType: string
  fileName: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
}

export const apiPostReport = async (
  data: ReportInput
): Promise<ReportDetails> => {
  const body: JsonOf<ReportInput> = {
    ...data
  }

  const report = await apiClient
    .post<ReportDetails>('/reports', body)
    .then((r) => r.data)
  await apiPostReportFile(report.id, data.files[0])

  return report
}


export const apiApproveReport = async (reportId: string
): Promise<void> => {
   await apiClient
    .post(`/reports/${reportId}/approve`, {})
}

const apiPostReportFile = (
  id: string,
  file: ReportFileInput
): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('description', file.description)
  formData.append('documentType', ReportFileDocumentType[file.documentType])

  return apiClient.postForm(`/reports/${id}/files`, formData)
}

export const apiGetReport = (id: string): Promise<ReportDetails> =>
  apiClient.get<ReportDetails>(`/reports/${id}`).then((res) => res.data)

export const apiGetReportFiles = (id: string): Promise<ReportFileDetails[]> =>
  apiClient
    .get<ReportFileDetails[]>(`/reports/${id}/files`)
    .then((res) => res.data)
