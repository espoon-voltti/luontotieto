// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { JsonOf } from 'shared/api-utils'
import FileSaver from 'file-saver'

import { Order, OrderFileDocumentType } from './order-api'

export interface ReportFormInput {
  name: string
  description: string
  filesToAdd: ReportFileInput[]
  filesToRemove: string[]
}

export interface ReportInput {
  name: string
  description: string
}

export function getDocumentTypeTitle<
  T extends ReportFileDocumentType | OrderFileDocumentType
>(dt: T) {
  switch (dt) {
    case ReportFileDocumentType.LIITO_ORAVA_ALUEET:
      return 'Liito-orava alueet'
    case ReportFileDocumentType.LIITO_ORAVA_PISTEET:
      return 'Liito-orava pisteet'
    case ReportFileDocumentType.LIITO_ORAVA_VIIVAT:
      return 'Liito-orava viivat'
    case OrderFileDocumentType.ORDER_INFO:
      return 'Tilauksen esitiedot'
    case OrderFileDocumentType.ORDER_AREA:
      return 'Aluerajaus'
    default:
      return 'Puuttuu'
  }
}

export enum ReportFileDocumentType {
  LIITO_ORAVA_PISTEET = 'LIITO_ORAVA_PISTEET',
  LIITO_ORAVA_ALUEET = 'LIITO_ORAVA_ALUEET',
  LIITO_ORAVA_VIIVAT = 'LIITO_ORAVA_VIIVAT'
}

export const reportFileDocumentTypes = [
  ReportFileDocumentType.LIITO_ORAVA_ALUEET,
  ReportFileDocumentType.LIITO_ORAVA_PISTEET,
  ReportFileDocumentType.LIITO_ORAVA_VIIVAT
]

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
  order?: Order
}

export interface ReportFileDetails extends ReportFileInput {
  id: string
  mediaType: string
  fileName: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
  reportId: string
}

export const apiPostReport = async (
  reportInput: ReportFormInput
): Promise<ReportDetails> => {
  const body: JsonOf<ReportInput> = {
    ...reportInput
  }

  const report = await apiClient
    .post<ReportDetails>('/reports', body)
    .then((r) => r.data)

  for (const id of reportInput.filesToRemove) {
    await apiClient.delete(`/reports/${report.id}/files/${id}`)
  }

  for (const file of reportInput.filesToAdd) {
    await apiPostReportFile(report.id, file)
  }

  return report
}

export const apiPutReport = async (
  reportId: string,
  reportInput: ReportFormInput
): Promise<ReportDetails> => {
  const body: JsonOf<ReportInput> = {
    ...reportInput
  }

  const report = await apiClient
    .put<ReportDetails>(`/reports/${reportId}`, body)
    .then((r) => r.data)

  for (const id of reportInput.filesToRemove) {
    await apiClient.delete(`/reports/${report.id}/files/${id}`)
  }

  for (const file of reportInput.filesToAdd) {
    await apiPostReportFile(report.id, file)
  }

  return report
}

export const apiApproveReport = async (reportId: string): Promise<void> => {
  await apiClient.post(`/reports/${reportId}/approve`, {})
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

export const apiGetReports = (): Promise<ReportDetails[]> =>
  apiClient.get<ReportDetails[]>(`/reports`).then((res) => res.data)

export const apiGetReportFiles = (id: string): Promise<ReportFileDetails[]> =>
  apiClient
    .get<ReportFileDetails[]>(`/reports/${id}/files`)
    .then((res) => res.data)

export const apiGetReportFileUrl = (
  reportId: string,
  fileId: string
): Promise<string> =>
  apiClient
    .get<string>(`/reports/${reportId}/files/${fileId}`)
    .then((res) => res.data)

export const apiGetReportDocumentTypeFileTemplate = (
  documentType: ReportFileDocumentType
): Promise<unknown> =>
  apiClient
    .get<Blob>(`/reports/template/${documentType}.gpkg`, {
      responseType: 'blob'
    })
    .then((res) => {
      const fileName = res.headers['content-disposition']
        .split('filename=')[1]
        .replace(/"/g, '')

      FileSaver.saveAs(res.data, fileName)
    })
