// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { AxiosHeaders, AxiosResponse } from 'axios'
import FileSaver from 'file-saver'
import { JsonOf } from 'shared/api-utils'

import { Order, OrderFileDocumentType } from './order-api'

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
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET:
      return 'Muut huomioitavat lajit pisteet'
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT:
      return 'Muut huomioitavat lajit viivat'
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET:
      return 'Muut huomioitavat lajit alueet'
    case ReportFileDocumentType.LEPAKKO_ALUEET:
      return 'Lepakko alueet'
    case ReportFileDocumentType.LEPAKKO_VIIVAT:
      return 'Lepakko viivat'
    case ReportFileDocumentType.LUMO_ALUEET:
      return 'Lumo alueet'
    case ReportFileDocumentType.NORO_VIIVAT:
      return 'Noro viivat'
    case ReportFileDocumentType.LUONTOTYYPIT_ALUEET:
      return 'Luontotyypit alueet'
    case ReportFileDocumentType.EKOYHTEYDET_ALUEET:
      return 'Ekoyhteydet alueet'
    case ReportFileDocumentType.EKOYHTEYDET_VIIVAT:
      return 'Ekoyhteydet viivat'
    case ReportFileDocumentType.LAHTEET_PISTEET:
      return 'Lähteet pisteet'
    case ReportFileDocumentType.OTHER:
      return 'Muu liite'
    case ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS:
      return 'Lopullinen aluerajaus'
    case ReportFileDocumentType.REPORT:
      return 'Selvitysraportti'
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
  LIITO_ORAVA_VIIVAT = 'LIITO_ORAVA_VIIVAT',
  MUUT_HUOMIOITAVAT_LAJIT_PISTEET = 'MUUT_HUOMIOITAVAT_LAJIT_PISTEET',
  MUUT_HUOMIOITAVAT_LAJIT_VIIVAT = 'MUUT_HUOMIOITAVAT_LAJIT_VIIVAT',
  MUUT_HUOMIOITAVAT_LAJIT_ALUEET = 'MUUT_HUOMIOITAVAT_LAJIT_ALUEET',
  ALUERAJAUS_LUONTOSELVITYS = 'ALUERAJAUS_LUONTOSELVITYS',
  LEPAKKO_VIIVAT = 'LEPAKKO_VIIVAT',
  LEPAKKO_ALUEET = 'LEPAKKO_ALUEET',
  LUMO_ALUEET = 'LUMO_ALUEET',
  NORO_VIIVAT = 'NORO_VIIVAT',
  LUONTOTYYPIT_ALUEET = 'LUONTOTYYPIT_ALUEET',
  EKOYHTEYDET_ALUEET = 'EKOYHTEYDET_ALUEET',
  EKOYHTEYDET_VIIVAT = 'EKOYHTEYDET_VIIVAT',
  LAHTEET_PISTEET = 'LAHTEET_PISTEET',
  OTHER = 'OTHER',
  REPORT = 'REPORT'
}

export interface ReportFormInput {
  name: string
  noObservations: string[] | null
  filesToAdd: ReportFileInput[]
  filesToRemove: string[]
}

export interface ReportDetails {
  id: string
  name: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
  approved: boolean
  noObservations: ReportFileDocumentType[] | null
  order: Order
  reportDocumentsString?: string
}

export interface ReportFileInput {
  description: string
  documentType: ReportFileDocumentType
  file: File
  saveErrors?: ReportFileValidationError[]
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

export const apiPutReport = async (
  reportInput: { reportId: string } & ReportFormInput
): Promise<ReportDetails> => {
  const body: JsonOf<ReportFormInput> = {
    ...reportInput
  }

  const report = await apiClient
    .put<ReportDetails>(`/reports/${reportInput.reportId}`, body)
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

export const apiReOpenReport = async (reportId: string): Promise<void> => {
  await apiClient.post(`/reports/${reportId}/reopen`, {})
}

export interface ReportFileValidationError {
  id: string
  column: string
  value: null
  reason: string
}

export interface ReportFileValidationErrorResponse {
  documentType: ReportFileDocumentType
  errors: ReportFileValidationError[]
}

const apiPostReportFile = async (
  id: string,
  file: ReportFileInput
): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('description', file.description)
  formData.append('documentType', ReportFileDocumentType[file.documentType])

  await apiClient
    .postForm(`/reports/${id}/files`, formData)
    .catch((error: { response: { data: ReportFileValidationError } }) => {
      const errorResponse = {
        documentType: file.documentType,
        errors: error.response.data
      }
      return Promise.reject(errorResponse)
    })
  return Promise.resolve()
}

export const apiGetReport = (id: string): Promise<ReportDetails> =>
  apiClient.get<ReportDetails>(`/reports/${id}`).then((res) => res.data)

export const apiGetReports = (): Promise<ReportDetails[]> =>
  apiClient.get<ReportDetails[]>(`/reports`).then((res) =>
    res.data.map((report) => {
      const reportApiDocumentsString =
        report.order.reportDocuments
          .map((r) => getDocumentTypeTitle(r.documentType))
          .join(', ') ?? ''

      return {
        ...report,
        reportDocumentsString: reportApiDocumentsString
      }
    })
  )

export const apiGetReportsAsCsv = (): Promise<unknown> =>
  apiClient
    .get<Blob>(`/reports/csv`, {
      responseType: 'blob'
    })
    .then((res: AxiosResponse<Blob, AxiosHeaders>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dispositionHeader: string = res.headers['content-disposition'] ?? ''
      const fileParameter = dispositionHeader.split('filename=')[1] ?? ''
      const fileName = fileParameter.replace(/"/g, '')
      if (fileName.length > 0) {
        FileSaver.saveAs(res.data, fileName)
      }
    })

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
): Promise<void> =>
  apiClient
    .get<Blob>(`/reports/template/${documentType}.gpkg`, {
      responseType: 'blob'
    })
    .then((res: AxiosResponse<Blob, AxiosHeaders>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dispositionHeader: string = res.headers['content-disposition'] ?? ''
      const fileParameter = dispositionHeader.split('filename=')[1] ?? ''
      const fileName = fileParameter.replace(/"/g, '')
      if (fileName.length > 0) {
        FileSaver.saveAs(res.data, fileName)
      }
    })
