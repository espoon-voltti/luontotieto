// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import csurf from 'csurf'
import express from 'express'
import { useSecureCookies } from '../config.js'

// Middleware that does XSRF header checks
export const csrf = csurf({ cookie: false })

export const csrfCookieName = 'luontotieto.xsrf'

// Returns a middleware that sets XSRF cookie that the frontend should use in
// requests. This only needs to be done in the "entry point" URL, which is called
// before any other requests for a page are done
export function csrfCookie(): express.RequestHandler {
  return (req, res, next) => {
    res.cookie(csrfCookieName, req.csrfToken(), {
      httpOnly: false, // the entire point is to be readable from JS
      secure: useSecureCookies,
      sameSite: 'lax'
    })
    next()
  }
}
