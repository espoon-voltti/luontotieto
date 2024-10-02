// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiClient } from 'api-client'

interface GeoServerReloadResponse {
  isSuccess: boolean
}
export const apiGeoserverReloadConfiguration =
  async (): Promise<GeoServerReloadResponse> =>
    apiClient
      .get<GeoServerReloadResponse>('/geoserver/reload-configuration')
      .then((r) => {
        if (r.data.isSuccess === false) {
          throw new Error('Failed to reload GeoServer configuration')
        }
        return r.data
      })
