// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ErrorRequestHandler } from 'express'

import { csrfCookieName } from '../config.js'
import { logError } from '../logging/index.js'
import { toError } from '../utils/error-utils.js'

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // https://github.com/expressjs/csurf#custom-error-handling
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (error.code === 'EBADCSRFTOKEN') {
    console.warn(
      'CSRF token error',
      req,
      {
        // eslint-disable-next-line
        xsrfCookie: req.cookies[csrfCookieName],
        xsrfHeader: req.header('x-xsrf-token')
      },
      error
    )
    if (!res.headersSent) {
      res.status(403).send({ message: 'CSRF token error' })
    }
    return
  }

  return fallbackErrorHandler(error, req, res, next)
}

export const fallbackErrorHandler: ErrorRequestHandler = (error, req, res) => {
  logError(
    `Internal server error: ${error instanceof Error ? error.message || error : String(error)}`,
    req,
    undefined,
    toError(error)
  )
  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
