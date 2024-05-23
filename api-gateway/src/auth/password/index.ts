// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import express, { Router } from 'express'
import { postPasswordLogin } from '../../clients/service-client.js'
import { logError } from '../../logging/index.js'

passport.use(
  'password',
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      const user = await postPasswordLogin(email, password).catch((reason) => {
        logError('Login failed', undefined, undefined, reason)
        return undefined
      })

      if (user) {
        return done(undefined, user)
      }
      return done(undefined, false, { message: 'Invalid email or password.' })
    }
  )
)

export function createPasswordAuthRouter(): Router {
  const router = Router()
  router.use(express.json())

  router.post('/login', passport.authenticate('password'), (req, res) => {
    if (req.user) {
      res.sendStatus(200)
    } else {
      res.sendStatus(401)
    }
  })

  router.post('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.sendStatus(200)
    })
  })

  return router
}
