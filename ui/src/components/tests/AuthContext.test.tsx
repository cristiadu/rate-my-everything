import { screen } from '@testing-library/react'
import { decodeToken } from '@/components/users/AuthContext'
import UserRole from '@/components/users/UserRole'
import { makeToken, signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('decodeToken', () => {
  test('reads the user from a valid token', () => {
    // GIVEN
    const token = makeToken([UserRole.ADMIN], { id: 7, username: 'boss' })

    // WHEN
    const user = decodeToken(token)

    // THEN
    expect(user).toEqual({ id: 7, username: 'boss', roles: ['admin'] })
  })

  test('rejects an expired token', () => {
    // GIVEN
    const token = makeToken([UserRole.USER], { exp: 1 })

    // WHEN
    const user = decodeToken(token)

    // THEN
    expect(user).toBeNull()
  })

  test('rejects a malformed token', () => {
    // GIVEN
    const token = 'not-a-token'

    // WHEN
    const user = decodeToken(token)

    // THEN
    expect(user).toBeNull()
  })
})

describe('AuthProvider', () => {
  test('clears an expired stored token and treats the user as signed out', () => {
    // GIVEN
    signInAs([UserRole.ADMIN], { exp: 1 })

    // WHEN
    renderAppAt('/account')

    // THEN
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})
