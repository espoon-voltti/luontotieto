// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Router } from 'express'
import expressHttpProxy from 'express-http-proxy'

import { errorHandler } from './middleware/errors.js'
import { appCommit, Config, serviceUrl } from './config.js'
import { RedisClient } from './clients/redis-client.js'
import { sessionSupport } from './auth/session.js'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import { cacheControl } from './middleware/cache-control.js'
import { requireAuthentication } from './auth/index.js'
import { csrf, csrfCookie } from './middleware/csrf.js'
import { createAdSamlStrategy, createSamlConfig } from './auth/saml/index.js'
import redisCacheProvider from './auth/saml/passport-saml-cache-redis.js'
import { createDevAdRouter } from './auth/dev-ad-auth.js'
import createSamlRouter from './auth/saml/saml-routes.js'
import authStatus from './auth/auth-status.js'
import { createServiceRequestHeaders } from './clients/service-client.js'

export function createRouter(config: Config, redisClient: RedisClient): Router {
  const router = Router()

  const sessions = sessionSupport(redisClient, config.session)

  router.use(sessions.middleware)
  router.use(passport.session())
  router.use(cookieParser(config.session.cookieSecret))

  router.use(cacheControl(() => 'forbid-cache'))

  router.all('/system/*', (_, res) => res.sendStatus(404))

  if (config.ad.type === 'mock') {
    router.use('/auth/saml', createDevAdRouter(sessions))
  } else if (config.ad.type === 'saml') {
    router.use(
      '/auth/saml',
      createSamlRouter({
        sessions,
        strategyName: 'ead',
        strategy: createAdSamlStrategy(
          sessions,
          config.ad,
          createSamlConfig(
            config.ad.saml,
            redisCacheProvider(redisClient, { keyPrefix: 'ad-saml-resp:' })
          )
        )
      })
    )
  }

  router.get('/auth/status', csrf, csrfCookie(), authStatus(sessions))

  router.get('/version', (_, res) => {
    res.send({ commitId: appCommit })
  })
  router.use(requireAuthentication)
  router.use(csrf)

  router.use(
    expressHttpProxy(serviceUrl, {
      parseReqBody: false,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const headers = createServiceRequestHeaders(srcReq)
        proxyReqOpts.headers = {
          ...proxyReqOpts.headers,
          ...headers
        }
        return proxyReqOpts
      }
    })
  )
  router.use(errorHandler)

  return router
}
