// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'

interface GeoServerReloadResponse {
  isSuccess: true
}
export const apiGeoserverReloadConfiguration =
  async (): Promise<GeoServerReloadResponse> =>
    apiClient
      .get<GeoServerReloadResponse>('/geoserver/reload-configuration')
      .then((r) => r.data)
