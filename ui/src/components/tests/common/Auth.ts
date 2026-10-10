import { UserRole } from '@/components/types'

// Builds an unsigned JWT-shaped token carrying the given roles, for UI tests only
export const makeTestToken = (roles: UserRole[]) => {
  const encode = (value: object) => btoa(JSON.stringify(value))
  return `${encode({ alg: 'none' })}.${encode({ id: 1, username: 'admin', roles })}.signature`
}

export const loginAs = (roles: UserRole[]) => {
  localStorage.setItem('authToken', makeTestToken(roles))
}
