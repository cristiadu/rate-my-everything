import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request } from 'express'
import jwt from 'jsonwebtoken'
import { BEARER_AUTH, expressAuthentication } from '@/helpers/Authentication'
import { RequestRejected } from '@/errors/RequestRejected'
import ErrorCode from '@/errors/ErrorCode'
import UserRole from '@/models/UserRole'
import { SessionUser } from '@/models/User'

/** Secret the tokens of these tests are signed with. */
const TEST_JWT_SECRET = 'authentication-test-secret'

/** A signed-in user who holds only the user role. */
const PLAIN_USER: SessionUser = { id: 7, username: 'plain', roles: [UserRole.USER] }

/** Builds a request carrying the given Authorization header. */
const requestWithAuthorization = (authorization?: string) => ({ headers: { authorization } }) as Request

/** Builds a request with a bearer token signed for the given payload, usually a user. */
const requestFor = (payload: string | object) => requestWithAuthorization(`Bearer ${jwt.sign(payload, TEST_JWT_SECRET)}`)

/** Runs the authentication and returns the API error it rejected the request with. */
const rejectionOf = async (authentication: Promise<SessionUser>) => {
  const error = await authentication.catch((thrown: unknown) => thrown)
  expect(error).toBeInstanceOf(RequestRejected)
  return (error as RequestRejected).apiError
}

describe('expressAuthentication', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the user of a valid token holding an allowed role', async () => {
    // GIVEN a user's token and an operation open to users
    const request = requestFor(PLAIN_USER)

    // WHEN the request is authenticated
    const sessionUser = await expressAuthentication(request, BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])

    // THEN the token's user comes back
    expect(sessionUser).toMatchObject(PLAIN_USER)
  })

  it('rejects a request without a token with 401', async () => {
    // GIVEN a request without an Authorization header
    const request = requestWithAuthorization()

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.USER]))

    // THEN it is unauthorized
    expect(apiError).toMatchObject({ code: ErrorCode.UNAUTHORIZED, status: 401, message: 'Missing or invalid authorization header' })
  })

  it('rejects a token signed with another secret with 401', async () => {
    // GIVEN a token signed with a different secret
    const request = requestWithAuthorization(`Bearer ${jwt.sign(PLAIN_USER, 'another-secret')}`)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.USER]))

    // THEN it is unauthorized
    expect(apiError).toMatchObject({ code: ErrorCode.UNAUTHORIZED, status: 401, message: 'Invalid token' })
  })

  it('rejects a security scheme other than the bearer token with 401', async () => {
    // GIVEN a user's token checked against an API key scheme
    const request = requestFor(PLAIN_USER)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, 'apiKey', [UserRole.USER]))

    // THEN the scheme is unknown
    expect(apiError).toMatchObject({ code: ErrorCode.UNAUTHORIZED, status: 401, message: 'Unknown security scheme: apiKey' })
  })

  it('rejects every token with 500 when the server has no JWT secret', async () => {
    // GIVEN a valid user token and a server without JWT_SECRET
    vi.stubEnv('JWT_SECRET', '')
    const request = requestFor(PLAIN_USER)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.USER]))

    // THEN it fails as an internal error
    expect(apiError).toMatchObject({ code: ErrorCode.INTERNAL_ERROR, status: 500, message: 'Internal server error' })
  })

  it.each([
    ['a text payload', 'plain'],
    ['a payload without roles', { id: 7, username: 'plain' }],
  ])('rejects a token with %s with 401', async (_payloadKind, payload) => {
    // GIVEN a correctly signed token whose payload is not a user
    const request = requestFor(payload)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.USER]))

    // THEN it is unauthorized
    expect(apiError).toMatchObject({ code: ErrorCode.UNAUTHORIZED, status: 401, message: 'Invalid user object in JWT payload' })
  })

  it('rejects a token holding a role that does not exist with 401', async () => {
    // GIVEN a correctly signed token for a user with the role superuser
    const request = requestFor({ ...PLAIN_USER, roles: ['superuser'] })

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.USER]))

    // THEN it is unauthorized
    expect(apiError).toMatchObject({ code: ErrorCode.UNAUTHORIZED, status: 401, message: 'Invalid roles in user object' })
  })

  it('rejects a user without any of the allowed roles with 403', async () => {
    // GIVEN a user's token and an operation open to admins only
    const request = requestFor(PLAIN_USER)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.ADMIN]))

    // THEN it is forbidden
    expect(apiError).toMatchObject({ code: ErrorCode.FORBIDDEN, status: 403 })
  })
})
