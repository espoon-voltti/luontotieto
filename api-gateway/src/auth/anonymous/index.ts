// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import passport from 'passport'
import { Strategy as AnonymousStrategy } from 'passport-anonymous'
import express, { Router } from 'express'

passport.use(new AnonymousStrategy())

export function createAnonymousAuthRouter(): Router {
  const router = Router()
  router.use(express.json())

  router.post('/login', passport.authenticate('anonymous'), (req, res) => {
    res.status(200).json({ name: 'anonymous' })
  })

  return router
}
