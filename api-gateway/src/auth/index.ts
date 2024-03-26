// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express, { NextFunction, Request, Response } from 'express'
import { Profile } from '@node-saml/passport-saml'
import passport, { AuthenticateCallback } from 'passport'
import { fromCallback } from '../utils/promise-utils.js'
import { Sessions } from './session.js'
import { logInfo } from '../logging/index.js'
import jwt from 'jsonwebtoken'
import { jwtKid, jwtPrivateKey } from '../config.js'
import { readFileSync } from 'node:fs'

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user || !req.user.id) {
    logInfo('Could not find user', req)
    res.sendStatus(401)
    return
  }
  return next()
}

export interface AppSessionUser {
  id?: string | undefined
}

const jwtPrivateKeyValue = readFileSync(jwtPrivateKey)

export function createAuthHeader(user: AppSessionUser): string {
  if (!user.id) {
    throw new Error('User is missing an id')
  }

  const jwtPayload = {
    sub: user.id
  }
  const jwtToken = jwt.sign(jwtPayload, jwtPrivateKeyValue, {
    algorithm: 'RS256',
    expiresIn: '48h',
    keyid: jwtKid
  })
  return `Bearer ${jwtToken}`
}

export function createLogoutToken(
  nameID: Required<Profile>['nameID'],
  sessionIndex: Profile['sessionIndex']
) {
  return `${nameID}:::${sessionIndex}`
}

export const authenticate = async (
  strategyName: string,
  req: express.Request,
  res: express.Response
): Promise<Express.User | undefined> =>
  await new Promise<Express.User | undefined>((resolve, reject) => {
    const cb: AuthenticateCallback = (err, user) =>
      err ? reject(err) : resolve(user || undefined)
    const next: express.NextFunction = (err) =>
      err ? reject(err) : resolve(undefined)
    passport.authenticate(strategyName, cb)(req, res, next)
  })

export const login = async (
  req: express.Request,
  user: Express.User
): Promise<void> => {
  await fromCallback<void>((cb) => req.logIn(user, cb))
  // Passport has now regenerated the active session and saved it, so we have a
  // guarantee that the session ID has changed and Redis has stored the new session data
}

export const logout = async (
  sessions: Sessions,
  req: express.Request,
  res: express.Response
): Promise<void> => {
  // Pre-emptively clear the cookie, so even if something fails later, we
  // will end up clearing the cookie in the response
  res.clearCookie(sessions.cookieName)

  const logoutToken = req.session?.logoutToken?.value

  await fromCallback<void>((cb) => req.logOut(cb))
  // Passport has now saved the previous session with null user and regenerated
  // the active session, so we have a guarantee that the ID has changed and
  // the old session data in Redis no longer includes the user

  if (logoutToken) {
    await sessions.consumeLogoutToken(logoutToken)
  }
  await fromCallback((cb) =>
    req.session ? req.session.destroy(cb) : cb(undefined)
  )
}
