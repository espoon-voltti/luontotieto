// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { z } from 'zod'
import _ from 'lodash'
import {
  CacheProvider,
  Profile,
  SamlConfig,
  Strategy as SamlStrategy,
  VerifyWithRequest
} from '@node-saml/passport-saml'
import { logError, logWarn } from '../../logging/index.js'
import { createLogoutToken, AppSessionUser } from '../index.js'
import { appBaseUrl, Config, EspooSamlConfig } from '../../config.js'
import { readFileSync } from 'node:fs'
import certificates, { TrustedCertificates } from './certificates.js'
import express from 'express'
import path from 'node:path'
import { Sessions } from '../session.js'
import { fromCallback } from '../../utils/promise-utils.js'
import { userLogin } from '../../clients/service-client.js'

export function createSamlConfig(
  config: EspooSamlConfig,
  cacheProvider?: CacheProvider
): SamlConfig & { passReqToCallback: boolean } {
  const privateCert = readFileSync(config.privateCert, {
    encoding: 'utf8'
  })
  const lookupPublicCert = (cert: string) =>
    cert in certificates
      ? certificates[cert as TrustedCertificates]
      : readFileSync(cert, {
          encoding: 'utf8'
        })
  const publicCert = Array.isArray(config.publicCert)
    ? config.publicCert.map(lookupPublicCert)
    : lookupPublicCert(config.publicCert)

  return {
    acceptedClockSkewMs: 0,
    audience: config.issuer,
    cacheProvider,
    callbackUrl: config.callbackUrl,
    idpCert: publicCert,
    disableRequestedAuthnContext: true,
    decryptionPvk: config.decryptAssertions ? privateCert : undefined,
    entryPoint: config.entryPoint,
    identifierFormat:
      config.nameIdFormat ??
      'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    issuer: config.issuer,
    logoutUrl: config.logoutUrl,
    privateKey: privateCert,
    signatureAlgorithm: 'sha256',
    validateInResponseTo: config.validateInResponseTo,
    passReqToCallback: true,
    // When *both* wantXXXXSigned settings are false, passport-saml still
    // requires at least the whole response *or* the assertion to be signed, so
    // these settings don't introduce a security problem
    wantAssertionsSigned: false,
    wantAuthnResponseSigned: false
  }
}

// A subset of SAML Profile fields that are expected to be present in Profile
// *and* req.user in valid SAML sessions
const SamlProfileId = z.object({
  nameID: z.string(),
  sessionIndex: z.string().optional()
})

const AD_GIVEN_NAME_KEY =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
const AD_FAMILY_NAME_KEY =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
const AD_EMAIL_KEY =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'

export function createAdSamlStrategy(
  sessions: Sessions,
  config: Config['ad'],
  samlConfig: SamlConfig
): SamlStrategy {
  const Profile = z.object({
    [config.userIdKey]: z.string(),
    [AD_GIVEN_NAME_KEY]: z.string(),
    [AD_FAMILY_NAME_KEY]: z.string(),
    [AD_EMAIL_KEY]: z.string().optional()
  })

  const login = async (profile: Profile): Promise<AppSessionUser> => {
    const asString = (value: unknown) =>
      value == null ? undefined : String(value)

    const aad = profile[config.userIdKey]
    if (!aad) throw Error('No user ID in SAML data')
    const person = await userLogin({
      externalId: `${config.externalIdPrefix}:${aad}`,
      firstName: asString(profile[AD_GIVEN_NAME_KEY]) ?? '',
      lastName: asString(profile[AD_FAMILY_NAME_KEY]) ?? '',
      email: asString(profile[AD_EMAIL_KEY])
    })
    return {
      id: person.id
    }
  }

  const loginVerify: VerifyWithRequest = (req, profile, done) => {
    if (!profile) return done(null, undefined)
    const parseResult = Profile.safeParse(profile)
    if (!parseResult.success) {
      logWarn(
        `SAML profile parsing failed: ${parseResult.error.message}`,
        undefined,
        {
          issuer: profile.issuer
        },
        parseResult.error
      )
    }
    login(profile)
      .then((user) => {
        // Despite what the typings say, passport-saml assumes
        // we give it back a valid Profile, including at least some of these
        // SAML-specific fields
        const samlUser: AppSessionUser & Profile = {
          ...user,
          issuer: profile.issuer,
          nameID: profile.nameID,
          nameIDFormat: profile.nameIDFormat,
          nameQualifier: profile.nameQualifier,
          spNameQualifier: profile.spNameQualifier,
          sessionIndex: profile.sessionIndex
        }
        done(null, samlUser)
      })
      .catch(done)
  }

  const logoutVerify: VerifyWithRequest = (req, profile, done) =>
    (async () => {
      if (!profile) return undefined
      const profileId = SamlProfileId.safeParse(profile)
      if (!profileId.success) return undefined
      if (!req.user) {
        // We're possibly doing SLO without a real session (e.g. browser has
        // 3rd party cookies disabled). We need to retrieve the session data
        // and recreate req.user for this request
        const logoutToken = createLogoutToken(
          profile.nameID,
          profile.sessionIndex
        )
        const user = await sessions.logoutWithToken(logoutToken)
        if (user) {
          // Set req.user for *this request only*
          await fromCallback((cb) =>
            req.login(user, { session: false, keepSessionInfo: false }, cb)
          )
        }
      }
      const reqUser: Partial<Profile> = (req.user ?? {}) as Partial<Profile>
      const reqId = SamlProfileId.safeParse(reqUser)
      if (reqId.success && _.isEqual(reqId.data, profileId.data)) {
        return reqUser
      }
    })()
      .then((user) => done(null, user))
      .catch((err) => done(err))

  return new SamlStrategy(samlConfig, loginVerify, logoutVerify)
}

export function parseRelayState(req: express.Request): string | undefined {
  const relayState = req.body?.RelayState || req.query.RelayState

  if (typeof relayState === 'string' && path.isAbsolute(relayState)) {
    if (appBaseUrl === 'local') {
      return relayState
    } else {
      const baseUrl = appBaseUrl.replace(/\/$/, '')
      const redirect = new URL(relayState, baseUrl)
      if (redirect.origin == baseUrl) {
        return redirect.href
      }
    }
  }

  if (relayState) logError('Invalid RelayState in request', req)

  return undefined
}
