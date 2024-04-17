// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'
import { JsonOf } from 'shared/api-utils'

import { ReportDetails, ReportFileDocumentType } from './report-api'

export interface Order extends OrderInput {
  id: string
  created: Date
  updated: Date
  createdBy: string
  updatedBy: string
}

export interface OrderFormInput {
  name: string
  description: string
  planNumber?: string
  reportDocuments: OrderReportDocumentInput[]
  filesToAdd: OrderFileInput[]
  filesToRemove: string[]
}

export interface OrderInput {
  name: string
  description: string
  planNumber?: string
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

export type OrderReportDocumentInput = Pick<
  OrderReportDocument,
  'description' | 'documentType'
>

export const apiPostOrder = async (data: OrderFormInput): Promise<string> => {
  const body: JsonOf<OrderInput> = {
    ...data
  }

  const orderId = await apiClient
    .post<string>('/orders', body)
    .then((r) => r.data)

  await handleFiles(orderId, data.filesToAdd, data.filesToRemove)

  return orderId
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
  orderId: string,
  orderInput: OrderFormInput
): Promise<Order> => {
  const body: JsonOf<OrderInput> = {
    ...orderInput
  }

  const order = await apiClient
    .put<Order>(`/orders/${orderId}`, body)
    .then((r) => r.data)

  await handleFiles(orderId, orderInput.filesToAdd, orderInput.filesToRemove)

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

export const apiGetOrders = (): Promise<Order[]> =>
  apiClient.get<Order[]>(`/orders`).then((res) => res.data)

export const apiGetOrderFiles = (id: string): Promise<OrderFile[]> =>
  apiClient.get<OrderFile[]>(`/orders/${id}/files`).then((res) => res.data)

export const apiPostOrderReport = async (
  orderId: string
): Promise<ReportDetails> =>
  await apiClient
    .post<ReportDetails>(`/orders/${orderId}/reports`, {})
    .then((r) => r.data)
