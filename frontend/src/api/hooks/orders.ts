// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import { useQuery } from '@tanstack/react-query'
import {
  apiGetOrder,
  apiGetOrderFiles,
  apiGetorderingUnits,
  apiGetPlanNumbers
} from 'api/order-api'

export function useGetOrderQuery(id?: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => {
      if (id) {
        return apiGetOrder(id)
      }
      return null
    },
    enabled: !!id
  })
}

export function useGetOrderFilesQuery(id?: string) {
  return useQuery({
    queryKey: ['orderFiles', id],
    queryFn: () => {
      if (id) {
        return apiGetOrderFiles(id)
      }
      return null
    },
    enabled: !!id
  })
}

export function useGetOrderPlanNumbersQuery() {
  return useQuery({
    queryKey: ['plan-numbers'],
    queryFn: () => apiGetPlanNumbers()
  })
}

export function useGetorderingUnitsQuery() {
  return useQuery({
    queryKey: ['orderer-units'],
    queryFn: () => apiGetorderingUnits()
  })
}
