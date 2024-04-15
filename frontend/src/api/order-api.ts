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

export interface OrderInput {
  name: string
  description: string
  planNumber?: string
  reportDocuments: OrderReportDocumentInput[]
  files: OrderFileInput[]
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

export interface OrderReportDocumentInput
  extends Pick<OrderReportDocument, 'description' | 'documentType'> {}

export const apiPostOrder = async (data: OrderInput): Promise<string> => {
  const body: JsonOf<OrderInput> = {
    ...data
  }

  const orderId = await apiClient
    .post<string>('/orders', body)
    .then((r) => r.data)

  for (const file of data.files) {
    await apiPostOrderFile(orderId, file)
  }
  return orderId
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

export const apiGetOrder = (id: string): Promise<Order> =>
  apiClient.get<Order>(`/orders/${id}`).then((res) => res.data)

export const apiGetOrderFiles = (id: string): Promise<OrderFile[]> =>
  apiClient.get<OrderFile[]>(`/orders/${id}/files`).then((res) => res.data)

export const apiPostOrderReport = async (
  orderId: string
): Promise<ReportDetails> => {
  return await apiClient
    .post<ReportDetails>(`/orders/${orderId}/reports`, {})
    .then((r) => r.data)
}
