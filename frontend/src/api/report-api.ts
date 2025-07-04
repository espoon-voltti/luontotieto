// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios'
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
      return 'Lähde pisteet'
    case ReportFileDocumentType.VIERASLAJIT_ALUEET:
      return 'Vieraslajit alueet'
    case ReportFileDocumentType.VIERASLAJIT_PISTEET:
      return 'Vieraslajit pisteet'
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

export function getReportDocumentTypeInfo<T extends ReportFileDocumentType>(
  dt: T
) {
  switch (dt) {
    case ReportFileDocumentType.LIITO_ORAVA_ALUEET:
      return 'Liito-oravien aluemaiset havainnot (elinalueet, ydinalueet, soveltuvat alueet).'
    case ReportFileDocumentType.LIITO_ORAVA_PISTEET:
      return 'Liito-oravien pistemäiset havainnot (papanapuut, pesäpuut jne.).'
    case ReportFileDocumentType.LIITO_ORAVA_VIIVAT:
      return 'Liito-oravien kulkuyhteydet viivakohteina.'
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_PISTEET:
      return 'Pistemäiset lajihavainnot (kaikki lajihavainnot, paitsi liito-orava).'
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_VIIVAT:
      return 'Lajeille olennaiset viivakohteet (esim. kulkureitit; kaikki lajit, paitsi liito-orava ja lepakot).'
    case ReportFileDocumentType.MUUT_HUOMIOITAVAT_LAJIT_ALUEET:
      return 'Lajeille olennaiset aluerajaukset (esim. elinalueet; kaikki lajit, paitsi liito-orava ja lepakot).'
    case ReportFileDocumentType.LEPAKKO_ALUEET:
      return 'Lepakoiden aluemaiset havainnot (lepakkoalueet: Luokka I, Luokka II, Luokka III).'
    case ReportFileDocumentType.LEPAKKO_VIIVAT:
      return 'Lepakoiden viivamaiset havainnot (esim. siirtymäreitit).'
    case ReportFileDocumentType.LUMO_ALUEET:
      return 'Aluemuotoiset rajaukset kohteista, jotka voidaan luokitella Espoon Lumo-kriteeristön mukaisesti.'
    case ReportFileDocumentType.NORO_VIIVAT:
      return 'Havumetsävyöhykkeen norot viivamaisina kohteina.'
    case ReportFileDocumentType.LUONTOTYYPIT_ALUEET:
      return 'Luontotyyppikuvioiden aluerajaukset.'
    case ReportFileDocumentType.EKOYHTEYDET_ALUEET:
      return 'Ekologiset yhteydet aluemuotoisina kohteina.'
    case ReportFileDocumentType.EKOYHTEYDET_VIIVAT:
      return 'Ekologiset yhteydet viivamaisina kohteina.'
    case ReportFileDocumentType.LAHTEET_PISTEET:
      return 'Lähteet pistemäisinä kohteina.'
    case ReportFileDocumentType.VIERASLAJIT_ALUEET:
      return 'Vieraslajit aluemuotoisina kohteina.'
    case ReportFileDocumentType.VIERASLAJIT_PISTEET:
      return 'Vieraslajit pistemäisinä kohteina.'
    case ReportFileDocumentType.OTHER:
      return 'Muu liite'
    case ReportFileDocumentType.ALUERAJAUS_LUONTOSELVITYS:
      return 'Lopullinen aluerajaus'
    case ReportFileDocumentType.REPORT:
      return 'Selvitysraportti'
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
  LEPAKKO_VIIVAT = 'LEPAKKO_VIIVAT',
  LEPAKKO_ALUEET = 'LEPAKKO_ALUEET',
  LUMO_ALUEET = 'LUMO_ALUEET',
  NORO_VIIVAT = 'NORO_VIIVAT',
  LUONTOTYYPIT_ALUEET = 'LUONTOTYYPIT_ALUEET',
  EKOYHTEYDET_ALUEET = 'EKOYHTEYDET_ALUEET',
  EKOYHTEYDET_VIIVAT = 'EKOYHTEYDET_VIIVAT',
  LAHTEET_PISTEET = 'LAHTEET_PISTEET',
  VIERASLAJIT_ALUEET = 'VIERASLAJIT_ALUEET',
  VIERASLAJIT_PISTEET = 'VIERASLAJIT_PISTEET',
  ALUERAJAUS_LUONTOSELVITYS = 'ALUERAJAUS_LUONTOSELVITYS',
  OTHER = 'OTHER',
  REPORT = 'REPORT'
}

export interface ReportFormInput {
  name: string
  noObservations: string[] | null
  filesToAdd: ReportFileInput[]
  filesToRemove: string[]
  isPublic?: boolean
  valid: boolean
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
  isPublic: boolean | null
  order: Order
  reportDocumentsString?: string
  cost?: string | null
}

export interface ReportFileInput {
  id: string
  description: string
  documentType: ReportFileDocumentType
  file: File
  saveErrors?: ReportFileValidationError[]
}

export interface ReportFileDetails extends ReportFileInput {
  mediaType: string
  fileName: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
  reportId: string
}

export const apiPutReport = async (
  reportInput: { reportId: string } & ReportFormInput & {
      sendUpdatedEmail: boolean
    }
): Promise<
  | ReportDetails
  | (ReportFileSuccessResponse | ReportFileValidationErrorResponse)[]
> => {
  const body: JsonOf<ReportFormInput> = {
    ...reportInput
  }

  const report = await apiClient
    .put<ReportDetails>(`/reports/${reportInput.reportId}`, body, {
      params: { sendUpdatedEmail: reportInput.sendUpdatedEmail }
    })
    .then((r) => r.data)

  for (const id of reportInput.filesToRemove) {
    await apiClient.delete(`/reports/${report.id}/files/${id}`)
  }

  /** Make sure we try to save all files so the saving does not stop with the first file with error */
  const postPromises = reportInput.filesToAdd.map((f) =>
    apiPostReportFile(report.id, f)
  )
  const responses = await Promise.all(postPromises)

  if (responses.find((r) => 'errors' in r)) {
    /** Return all file responses to make sure we have a list of the saved files also */
    return Promise.reject(responses)
  }
  // for (const file of reportInput.filesToAdd) {
  //   await apiPostReportFile(report.id, file)
  // }

  return report
}

export interface ApproveReportError {
  errorCode:
    | 'error-saving-paikkatieto-data'
    | 'error-validating-paikkatieto-data'
    | 'access-denied'
  errorMessages?: string[]
}

export const apiApproveReport = async (input: {
  reportId: string
  overrideReportName: boolean
  reportCost?: string
}): Promise<void> => {
  const { reportId, overrideReportName, reportCost } = input
  await apiClient
    .post(
      `/reports/${reportId}/approve`,
      {},
      { params: { overrideReportName, reportCost } }
    )
    .catch((error: { response: { data: ApproveReportError } }) => {
      const errorResponse = {
        errorCode: error.response.data.errorCode,
        errorMessages: error.response.data.errorMessages
      }
      return Promise.reject(errorResponse)
    })
  return Promise.resolve()
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

export type ReportFileSuccessResponse = {
  type: 'success'
}

export type ReportFileValidationErrorResponse = {
  type: 'error'
  documentType: ReportFileDocumentType
  errors: ReportFileValidationError[] | string
  name: string
  id: string
}

const apiPostReportFile = async (
  id: string,
  file: ReportFileInput
): Promise<ReportFileSuccessResponse | ReportFileValidationErrorResponse> => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('id', file.id)
  formData.append('description', file.description)
  formData.append('documentType', ReportFileDocumentType[file.documentType])

  return await apiClient
    .postForm(`/reports/${id}/files`, formData)
    .then(
      (_resp) =>
        ({
          type: 'success'
        }) satisfies ReportFileSuccessResponse
    )
    .catch((error: AxiosError) => {
      if (error.response?.status === 400) {
        const errorResponse = {
          type: 'error',
          documentType: file.documentType,
          id: file.id,
          name: file.file.name,
          errors: error?.response?.data
        } as ReportFileValidationErrorResponse
        return errorResponse
      } else if (error.response?.status === 409) {
        const errorResponse = {
          type: 'error',
          documentType: file.documentType,
          id: file.id,
          name: file.file.name,
          errors: 'Tiedostonimi on jo olemassa'
        } as ReportFileValidationErrorResponse
        return errorResponse
      } else if (error.response?.status === 413) {
        const errorResponse = {
          type: 'error',
          documentType: file.documentType,
          id: file.id,
          name: file.file.name,
          errors: 'Tiedosto on liian suuri. Sallittu maksimikoko on 100 Mt.'
        } as ReportFileValidationErrorResponse
        return errorResponse
      }
      return {
        type: 'error',
        documentType: file.documentType,
        id: file.id,
        name: file.file.name,
        errors: 'Tuntematon virhe'
      } as ReportFileValidationErrorResponse
    })
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

export const apiGetReportsAsCsv = (params: {
  startDate: string
  endDate: string
}): Promise<unknown> =>
  apiClient
    .get<Blob>(`/reports/csv`, {
      params,
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
