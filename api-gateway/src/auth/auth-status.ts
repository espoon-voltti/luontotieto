// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import express from 'express'
import { toRequestHandler } from '../utils/express.js'
import { AppUser, getUserDetails } from '../clients/service-client.js'
import { Sessions } from './session.js'
import { appCommit } from '../config.js'
import { logout } from './index.js'

interface AuthStatus {
  loggedIn: boolean
  user?: AppUser
  apiVersion: string
}

async function validateUser(
  req: express.Request
): Promise<AppUser | undefined> {
  const user = req.user
  if (!user || !user.id) return undefined
  return getUserDetails(req, user.id)
}

export default (sessions: Sessions) =>
  toRequestHandler(async (req, res) => {
    const sessionUser = req.user
    const validUser = sessionUser && (await validateUser(req))

    let status: AuthStatus
    if (validUser) {
      status = {
        loggedIn: true,
        user: validUser,
        apiVersion: appCommit
      }
    } else {
      if (sessionUser) {
        await logout(sessions, req, res)
      }
      status = {
        loggedIn: false,
        apiVersion: appCommit
      }
    }

    res.status(200).json(status)
  })
