import { getRolesFromToken } from '@/components/users/AuthContext'
import UserRole from '@api/models/UserRole'
import { makeTestToken } from '@/components/tests/common/Auth'

describe('getRolesFromToken', () => {
  test('reads roles from the token payload', () => {
    // GIVEN tokens with and without a readable payload
    const adminToken = makeTestToken([UserRole.ADMIN])

    // WHEN the roles are read
    const roles = [getRolesFromToken(adminToken), getRolesFromToken('not-a-token'), getRolesFromToken(null)]

    // THEN only the valid token yields roles
    expect(roles).toEqual([[UserRole.ADMIN], [], []])
  })
})
