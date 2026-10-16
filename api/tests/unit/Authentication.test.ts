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

/** A signed-in user who holds only the moderator role. */
const MODERATOR_ONLY: SessionUser = { id: 8, username: 'moderator', roles: [UserRole.MODERATOR] }

/** Builds a request carrying the given Authorization header. */
const requestWithAuthorization = (authorization?: string) => ({ headers: { authorization } }) as Request

/** Builds a request with a bearer token for the given user. */
const requestFor = (user: SessionUser) => requestWithAuthorization(`Bearer ${jwt.sign(user, TEST_JWT_SECRET)}`)

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

  it('rejects a user without any of the allowed roles with 403', async () => {
    // GIVEN a user's token and an operation open to admins only
    const request = requestFor(PLAIN_USER)

    // WHEN the request is authenticated
    const apiError = await rejectionOf(expressAuthentication(request, BEARER_AUTH, [UserRole.ADMIN]))

    // THEN it is forbidden
    expect(apiError).toMatchObject({ code: ErrorCode.FORBIDDEN, status: 403 })
  })

  it('lets a moderator use operations open to users', async () => {
    // GIVEN the token of a user holding only the moderator role and an operation open to users and admins
    const request = requestFor(MODERATOR_ONLY)

    // WHEN the request is authenticated
    const sessionUser = await expressAuthentication(request, BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])

    // THEN the moderator is let through as a user
    expect(sessionUser).toMatchObject(MODERATOR_ONLY)
  })
})
