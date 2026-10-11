import { describe, it, expect } from 'vitest'
import { canAccessRoute } from '@/helpers/RouteHelper'
import { RouteConfig } from '@/models/RouteConfig'
import UserRole from '@/models/UserRole'

/** A route users may read and only admins may change. */
const adminWriteRoute: RouteConfig = {
  path: '/api/test', controller: () => (_req, _res, next) => next(), roles: [UserRole.USER, UserRole.ADMIN], writeRoles: [UserRole.ADMIN],
}

describe('canAccessRoute', () => {
  it('lets users read a route with admin-only writes', () => {
    // GIVEN a user and a route with admin-only writes
    // WHEN they read it
    const allowed = canAccessRoute(adminWriteRoute, 'GET', [UserRole.USER])

    // THEN access is granted
    expect(allowed).toBe(true)
  })

  it.each(['POST', 'PUT', 'DELETE'])('blocks users from %s on a route with admin-only writes', (method) => {
    // GIVEN a user and a route with admin-only writes
    // WHEN they write to it
    const allowed = canAccessRoute(adminWriteRoute, method, [UserRole.USER])

    // THEN access is denied
    expect(allowed).toBe(false)
  })

  it('falls back to roles for writes when writeRoles is not set', () => {
    // GIVEN a route with roles only
    const route: RouteConfig = { ...adminWriteRoute, writeRoles: undefined }

    // WHEN a user writes to it
    const allowed = canAccessRoute(route, 'POST', [UserRole.USER])

    // THEN their read role is enough
    expect(allowed).toBe(true)
  })

  it('allows anyone on a route without roles', () => {
    // GIVEN a route without roles
    const route: RouteConfig = { path: '/api/open', controller: adminWriteRoute.controller }

    // WHEN a user with no roles calls it
    const allowed = canAccessRoute(route, 'POST', [])

    // THEN access is granted
    expect(allowed).toBe(true)
  })
})
