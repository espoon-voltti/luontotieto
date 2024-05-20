// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { JsonOf } from 'shared/api-utils'

import { ReportFileDocumentType } from './report-api'

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
}

export interface OrderInput {
  name: string
  description: string
  planNumber?: string[]
  assigneeId: string
  reportDocuments: OrderReportDocumentInput[]
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

export type OrderReportDocumentInput = Pick<OrderReportDocument, 'documentType'>

export const apiPostOrder = async (data: OrderFormInput): Promise<string> => {
  const body: JsonOf<OrderInput> = {
    ...data,
    //TODO: The description is to be removed (but for the moment a bit hesitant to remove it, lets clean it up later)
    reportDocuments: data.reportDocuments.map((rd) => ({
      ...rd,
      description: ''
    }))
  }

  const response = await apiClient
    .post<{ orderId: string; reportId: string }>('/orders', body)
    .then((r) => r.data)
  await handleFiles(response.orderId, data.filesToAdd, data.filesToRemove)

  return response.reportId
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

const apiPostOrderFile = (id: string, file: OrderFileInput): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('description', file.description)
  formData.append('documentType', OrderFileDocumentType[file.documentType])

  return apiClient.postForm(`/orders/${id}/files`, formData)
}

const apiDeleteOrderFile = (orderId: string, fileId: string): Promise<void> => {
  return apiClient.delete(`/orders/${orderId}/files/${fileId}`)
}

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
