// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type express from 'express'
import { BaseError } from 'make-error-cause'
import { AppSessionUser } from '../auth/index.js'
import passportSaml from '@node-saml/passport-saml'

export interface LogoutToken {
  // milliseconds value of a Date. Not an actual Date because it will be JSONified
  expiresAt: number
  value: string
}

export type AsyncRequestHandler = (
  req: express.Request,
  res: express.Response
) => Promise<void>

// A middleware calls next() on success, and next(err) on failure
export function toMiddleware(f: AsyncRequestHandler): express.RequestHandler {
  return (req, res, next) =>
    f(req, res)
      .then(() => next())
      .catch(next)
}

// A request handler calls nothing on success, and next(err) on failure
export function toRequestHandler(
  f: AsyncRequestHandler
): express.RequestHandler {
  return (req, res, next) => f(req, res).catch(next)
}

export function assertStringProp<T, K extends keyof T>(
  object: T,
  property: K
): string {
  const value = object[property]
  if (typeof value !== 'string') {
    throw new InvalidRequest(
      `Expected '${String(property)}' to be string, but it is ${value}`
    )
  }
  return value
}

export class InvalidRequest extends BaseError {}

// Use TS interface merging to add fields to express req.session
declare module 'express-session' {
  interface SessionData {
    idpProvider?: string | null
    logoutToken?: LogoutToken
  }
}

// Use TS interface merging to add fields to express req and req.user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      traceId?: string
      spanId?: string
      samlLogoutRequest: passportSaml.Profile
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends AppSessionUser {}
  }
}

// Configures the application to trust AWS environment reverse proxies
// This makes the following request properties to be based on the original
// request coming from the Internet:
// * `req.ip`: original client IP
// * `req.ips`: entire IP chain including all proxies
// * `req.protocol`: original protocol (https)
// * `req.hostname`: original hostname
// * `req.secure`: is original request https (true)
export function trustReverseProxy(app: express.Application) {
  app.set('trust proxy', 3) // private ALB, proxy nginx, public ALB
  app.use((req, res, next) => {
    if ('x-original-forwarded-proto' in req.headers) {
      req.headers['x-forwarded-proto'] =
        req.headers['x-original-forwarded-proto']
    }
    if ('x-original-forwarded-port' in req.headers) {
      req.headers['x-forwarded-port'] = req.headers['x-original-forwarded-port']
    }
    next()
  })
}
