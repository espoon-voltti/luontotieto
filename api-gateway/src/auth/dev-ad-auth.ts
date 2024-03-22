// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import _ from 'lodash'
import { Request, Router, urlencoded } from 'express'
import {
  assertStringProp,
  AsyncRequestHandler,
  toRequestHandler
} from '../utils/express.js'
import { AdUser, userLogin } from '../clients/service-client.js'
import { Sessions } from './session.js'
import passport, { Strategy } from 'passport'
import { AppSessionUser, authenticate, login, logout } from './index.js'
import { parseRelayState } from './saml/index.js'
import { appBaseUrl } from '../config.js'

class DevStrategy extends Strategy {
  constructor(private verifyUser: (req: Request) => Promise<AppSessionUser>) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authenticate(req: Request, _options?: any): any {
    this.verifyUser(req)
      .then((user) => this.success(user))
      .catch((err) => this.error(err))
  }
}

const devUsers: AdUser[] = [
  {
    externalId: 'ad:001',
    firstName: 'Sanna',
    lastName: 'Suunnittelija'
  },
  {
    externalId: 'ad:002',
    firstName: 'Olli Oiva Otto',
    lastName: 'Ohjaaja'
  }
]

const loginFormHandler: AsyncRequestHandler = async (req, res) => {
  const userOptions = devUsers.map((user, idx) => {
    const { externalId, firstName, lastName } = user
    const json = JSON.stringify(user)
    return `<div>
            <input
              type="radio"
              id="${externalId}"
              name="preset"
              ${idx == 0 ? 'checked' : ''}
              value="${_.escape(json)}" />
            <label for="${externalId}">${firstName} ${lastName}</label>
          </div>`
  })

  const formQuery =
    typeof req.query.RelayState === 'string'
      ? `?RelayState=${encodeURIComponent(req.query.RelayState)}`
      : ''
  const formUri = `${req.baseUrl}/login/callback${formQuery}`

  res.contentType('text/html').send(`
          <html lang='fi'>
          <body>
            <h1>Devausympäristön AD-kirjautuminen</h1>
            <form action="${formUri}" method="post">
                ${userOptions.join('\n')}
                <div style="margin-top: 20px">
                  <button type="submit">Kirjaudu</button>
                </div>
            </form>
          </body>
          </html>
        `)
}

const verifyUser = async (req: Request): Promise<AppSessionUser> => {
  const preset = assertStringProp(req.body, 'preset')
  const person = await userLogin(JSON.parse(preset))
  return {
    id: person.id
  }
}

export function createDevAdRouter(sessions: Sessions): Router {
  const strategyName = 'dev-ad'
  passport.use(strategyName, new DevStrategy(verifyUser))

  const router = Router()

  router.get('/login', toRequestHandler(loginFormHandler))
  router.post(
    `/login/callback`,
    urlencoded({ extended: false }), // needed to parse the POSTed form
    toRequestHandler(async (req, res) => {
      try {
        const user = await authenticate(strategyName, req, res)
        if (!user) {
          res.redirect(`${appBaseUrl}?loginError=true`)
        } else {
          await login(req, user)
          res.redirect(parseRelayState(req) ?? appBaseUrl)
        }
      } catch (err) {
        if (!res.headersSent) {
          res.redirect(`${appBaseUrl}?loginError=true`)
        }
        throw err
      }
    })
  )

  router.get(
    `/logout`,
    toRequestHandler(async (req, res) => {
      await logout(sessions, req, res)
      res.redirect('/kirjaudu')
    })
  )

  return router
}
