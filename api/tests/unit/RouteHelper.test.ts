import { describe, it, expect } from 'vitest'
import { canModerate } from '@/helpers/RouteHelper'
import UserRole from '@/models/UserRole'

describe('canModerate', () => {
  it.each([
    [[UserRole.ADMIN], true],
    [[UserRole.USER, UserRole.MODERATOR], true],
    [[UserRole.USER], false],
  ])('returns whether %j may moderate', (roles, expected) => {
    // GIVEN a user with these roles
    // WHEN checking whether they may moderate
    const allowed = canModerate(roles)

    // THEN only admins and moderators may
    expect(allowed).toBe(expected)
  })
})
