// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import express, { Router } from 'express'
import { postPasswordLogin } from '../../clients/service-client.js'

passport.use(
  'password',
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      const response = await postPasswordLogin(email, password)
      if ('errorCode' in response) {
        return done(null, false, { message: response.errorCode })
      } else {
        return done(undefined, response)
      }
    }
  )
)

export function createPasswordAuthRouter(): Router {
  const router = Router()
  router.use(express.json())

  router.post('/login', (req, res, next) => {
    passport.authenticate(
      'password',
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
      ) => {
        if (err) {
          return next(err)
        }
        if (!user) {
          // Authentication failed, send a custom error response
          return res
            .status(401)
            .json({ errorCode: info ? info.message : 'Unauthorized' })
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err)
          }
          return res.sendStatus(200)
        })
      }
    )(req, res, next)
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
