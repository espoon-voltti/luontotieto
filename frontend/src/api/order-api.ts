// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { AxiosError } from 'axios'
import { JsonOf } from 'shared/api-utils'

import { ReportDetails, ReportFileDocumentType } from './report-api'

export interface Order extends OrderInput {
  id: string
  created: Date
  updated: Date
  assignee: string
  createdBy: string
  updatedBy: string
}

export interface OrderFormInput {
  name: string
  description: string
  planNumber?: string[]
  reportDocuments: OrderReportDocumentInput[]
  filesToAdd: OrderFileInput[]
  filesToRemove: string[]
  assigneeId: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  assigneeContactPerson: string
  assigneeContactEmail: string
  returnDate: string
  orderingUnit?: string[]
}

export interface OrderInput {
  name: string
  description: string
  planNumber?: string[]
  assigneeId: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  assigneeContactPerson: string
  assigneeContactEmail: string
  returnDate: string
  reportDocuments: OrderReportDocumentInput[]
  orderingUnit?: string[]
}

export interface OrderReportDocument {
  orderId: string
  documentType: ReportFileDocumentType
  description: string
}

export enum OrderFileDocumentType {
  ORDER_INFO = 'ORDER_INFO',
  ORDER_AREA = 'ORDER_AREA'
}

export interface OrderFileValidationError {
  id: string
  column: string
  value: null
  reason: string
}

export interface OrderFileValidationErrorResponse {
  documentType: OrderFileDocumentType
  id: string
  errors: OrderFileValidationError[] | string
  orderId: string
}

export type OrderReportDocumentInput = Pick<OrderReportDocument, 'documentType'>

export const apiUpsertOrder = async (
  orderInput: { orderId?: string | undefined } & OrderFormInput
): Promise<{ orderId: string; reportId: string }> => {
  const body: JsonOf<OrderInput> = {
    ...orderInput,
    reportDocuments: orderInput.reportDocuments.map((rd) => ({
      ...rd,
      description: ''
    }))
  }

  let orderId = orderInput.orderId
  let reportId: string | undefined
  if (!orderInput.orderId) {
    await apiClient
      .post<{ orderId: string; reportId: string }>('/orders', body)
      .then((r) => r.data)
      .then((r) => {
        orderId = r.orderId
        reportId = r.reportId
      })
  } else {
    await apiClient
      .put<ReportDetails>(`/orders/${orderInput.orderId}`, body)
      .then((r) => r.data)
      .then((r) => {
        orderId = r.order.id
        reportId = r.id
      })
  }

  if (!reportId || !orderId) {
    throw new Error('Failed to create report')
  }

  await handleFiles(orderId, orderInput.filesToAdd, orderInput.filesToRemove)

  return { orderId, reportId }
}

const handleFiles = async (
  orderId: string,
  addFiles: OrderFileInput[],
  deleteFiles: string[]
) => {
  for (const id of deleteFiles) {
    await apiDeleteOrderFile(orderId, id)
  }
  for (const file of addFiles) {
    await apiPostOrderFile(orderId, file)
  }
}

export const apiPutOrder = async (
  orderInput: { orderId: string } & OrderFormInput
): Promise<Order> => {
  const body: JsonOf<OrderInput> = {
    ...orderInput,
    //TODO: The description is to be removed (but for the moment a bit hesitant to remove it, lets clean it up later)
    reportDocuments: orderInput.reportDocuments.map((rd) => ({
      ...rd,
      description: ''
    }))
  }

  const order = await apiClient
    .put<Order>(`/orders/${orderInput.orderId}`, body)
    .then((r) => r.data)

  await handleFiles(
    orderInput.orderId,
    orderInput.filesToAdd,
    orderInput.filesToRemove
  )

  return order
}

interface OrderFileInput {
  description: string
  documentType: OrderFileDocumentType
  file: File
  id: string
}

export interface OrderFile extends OrderFileInput {
  id: string
  mediaType: string
  fileName: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
  orderId: string
}

const apiPostOrderFile = async (
  id: string,
  file: OrderFileInput
): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('description', file.description)
  formData.append('documentType', OrderFileDocumentType[file.documentType])

  await apiClient
    .postForm(`/orders/${id}/files`, formData)
    .catch((error: AxiosError) => {
      if (error.response?.status === 400) {
        const errorResponse = {
          orderId: id,
          documentType: file.documentType,
          id: file.id,
          errors: error?.response?.data
        } as OrderFileValidationErrorResponse
        return Promise.reject(errorResponse)
      } else if (error.response?.status === 409) {
        const errorResponse = {
          orderId: id,
          documentType: file.documentType,
          id: file.id,
          errors: 'Tiedostonimi on jo olemassa'
        } as OrderFileValidationErrorResponse
        return Promise.reject(errorResponse)
      }
      return Promise.reject({
        orderId: id,
        id: file.id,
        documentType: file.documentType,
        errors: 'Tuntematon virhe'
      } as OrderFileValidationErrorResponse)
    })
}

const apiDeleteOrderFile = (orderId: string, fileId: string): Promise<void> =>
  apiClient.delete(`/orders/${orderId}/files/${fileId}`)

export const apiGetOrder = (id: string): Promise<Order> =>
  apiClient.get<Order>(`/orders/${id}`).then((res) => res.data)

export const apiGetOrderFiles = (id: string): Promise<OrderFile[]> =>
  apiClient.get<OrderFile[]>(`/orders/${id}/files`).then((res) => res.data)

export const apiGetOrderFileUrl = (
  orderId: string,
  fileId: string
): Promise<string> =>
  apiClient
    .get<string>(`/orders/${orderId}/files/${fileId}`)
    .then((res) => res.data)

export const apiGetPlanNumbers = (): Promise<string[]> =>
  apiClient.get<string[]>(`/orders/plan-numbers`).then((res) => res.data)

export const apiGetorderingUnits = (): Promise<string[]> =>
  apiClient.get<string[]>(`/orders/ordering-units`).then((res) => res.data)

export type DeleteorderErrorCode = 'order-delete-failed-existing-files'

export const DeleteOrderError = {
  'order-delete-failed-existing-files':
    'Tilaukseen on jo lisätty tiedostoja joten tilausta ei voitu poistaa.'
}
export const apiDeleteOrder = (id: string): Promise<void> =>
  apiClient.delete<void>(`/orders/${id}`).then((res) => res.data)
