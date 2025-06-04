// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import * as redis from '@redis/client'
import express from 'express'
import helmet from 'helmet'
import passport from 'passport'
import sourceMapSupport from 'source-map-support'

import { assertRedisConnection } from './clients/redis-client.js'
import { configFromEnv, httpPort, toRedisClientOpts } from './config.js'
import { logInfo, logError, loggingMiddleware } from './logging/index.js'
import { fallbackErrorHandler } from './middleware/errors.js'
import { createRouter } from './router.js'
import { trustReverseProxy } from './utils/express.js'

sourceMapSupport.install()
const config = configFromEnv()

const redisClient = redis.createClient(toRedisClientOpts(config.redis))
redisClient.on('error', (err) =>
  logError('Redis error', undefined, undefined, err)
)
redisClient.connect().catch((err) => {
  logError('Unable to connect to redis', undefined, undefined, err)
})
// Don't prevent the app from exiting if a redis connection is alive.
redisClient.unref()

const app = express()
trustReverseProxy(app)
app.set('etag', false)

app.use(
  helmet({
    // Content-Security-Policy is set by the nginx proxy
    contentSecurityPolicy: false
  })
)

app.get('/health', (_, res) => {
  assertRedisConnection(redisClient)
    .then(() => {
      res.status(200).json({ status: 'UP' })
    })
    .catch(() => {
      res.status(503).json({ status: 'DOWN' })
    })
})
app.use(loggingMiddleware)

passport.serializeUser<Express.User>((user, done) => done(null, user))
passport.deserializeUser<Express.User>((user, done) => done(null, user))

app.use('/api', createRouter(config, redisClient))
app.use(fallbackErrorHandler)

const server = app.listen(httpPort, () => {
  logInfo(`luontotieto API Gateway listening on port ${httpPort}`)
})

server.keepAliveTimeout = 70 * 1000
server.headersTimeout = 75 * 1000
