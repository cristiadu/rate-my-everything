import { UserRole } from '@/api/generated/api'

/** Base64-encodes a JSON value as one JWT segment. */
const encodeTokenSegment = (value: object) => btoa(JSON.stringify(value))

/** Builds an unsigned JWT-shaped token carrying the given roles, for UI tests only. */
export const makeTestToken = (roles: UserRole[]) => (
  `${encodeTokenSegment({ alg: 'none' })}.${encodeTokenSegment({ id: 1, username: 'admin', roles })}.signature`
)

/** Stores a test token so AuthProvider starts logged in with the given roles. */
export const loginAs = (roles: UserRole[]) => {
  localStorage.setItem('authToken', makeTestToken(roles))
}
