import type { JwtClaims } from '@/components/types'
import UserRole from '@/components/users/UserRole'

/** How long test tokens stay valid, in seconds. */
const TOKEN_LIFETIME_SECONDS = 3600

/** Encodes a JSON object as base64url, as JWT segments are. */
const base64Url = (value: object) => btoa(JSON.stringify(value))
  .replace(/=+$/, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')

/** Builds an unsigned JWT with the same claims the API puts in its tokens. */
export const makeToken = (roles: UserRole[], overrides: Partial<JwtClaims> = {}) => {
  const claims: JwtClaims = {
    id: 1,
    username: 'tester',
    roles,
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    ...overrides,
  }
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(claims)}.signature`
}

/** Stores a token for a user with the given roles, as a completed login would. */
export const signInAs = (roles: UserRole[], overrides: Partial<JwtClaims> = {}) => {
  localStorage.setItem('authToken', makeToken(roles, overrides))
}
