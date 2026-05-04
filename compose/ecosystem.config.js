// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

const path = require('path')

const defaults = {
  autorestart: false
}

module.exports = {
  apps: [{
    name: 'api-gateway',
    script: 'yarn && yarn clean && yarn dev',
    cwd: path.resolve(__dirname, '../api-gateway'),
    env: {
      HTTP_PORT: 3000,
      SERVICE_URL: 'http://localhost:8080',
      REDIS_PORT: 6379,
      BASE_URL: 'http://localhost:9000'
    },
    ...defaults
  }, {
    name: 'frontend',
    script: 'yarn && yarn clean && yarn dev',
    cwd: path.resolve(__dirname, '../frontend'),
    env: {
      API_GATEWAY_URL: 'http://localhost:3000'
    },
    ...defaults
  }, {
    name: 'service',
    script: `${__dirname}/run-after-db.sh`,
    args: './gradlew --no-daemon bootRun',
    cwd: path.resolve(__dirname, '../service'),
    env: {
      SPRING_PROFILES_ACTIVE: 'local',
      SERVER_PORT: 8080
    },
    ...defaults
  }
  ]
}
