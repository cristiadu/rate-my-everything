import React from 'react'
import { render, screen } from '@testing-library/react'
import RequireAdmin, {
  canModerate, getRolesFromToken, getUserIdFromToken, getUsernameFromToken, RequireLogin, RequireModerator,
} from '@/components/admin/RequireAdmin'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'

/** Renders RequireAdmin around a marker child inside the auth provider. */
const renderGuard = () => render(
  <AuthProvider>
    <RequireAdmin>
      <p>admin content</p>
    </RequireAdmin>
  </AuthProvider>,
)

describe('RequireAdmin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('reads roles from the token payload', () => {
    // GIVEN tokens with and without a readable payload
    const adminToken = makeTestToken([UserRole.ADMIN])

    // WHEN the roles are read
    const roles = [getRolesFromToken(adminToken), getRolesFromToken('not-a-token'), getRolesFromToken(null)]

    // THEN only the valid token yields roles
    expect(roles).toEqual([['admin'], [], []])
  })

  test('reads the username from the token payload', () => {
    // GIVEN tokens with and without a readable payload
    const userToken = makeTestToken([UserRole.USER])

    // WHEN the usernames are read
    const usernames = [getUsernameFromToken(userToken), getUsernameFromToken('not-a-token'), getUsernameFromToken(null)]

    // THEN only the valid token yields a username
    expect(usernames).toEqual(['admin', '', ''])
  })

  test('reads the user id from the token payload', () => {
    // GIVEN tokens with and without a readable payload
    const userToken = makeTestToken([UserRole.USER])

    // WHEN the user ids are read
    const userIds = [getUserIdFromToken(userToken), getUserIdFromToken('not-a-token'), getUserIdFromToken(null)]

    // THEN only the valid token yields an id
    expect(userIds).toEqual([1, null, null])
  })

  test('asks logged-out visitors to log in', () => {
    // GIVEN nobody is logged in
    // WHEN the guarded content renders
    renderGuard()

    // THEN a login message replaces it
    expect(screen.getByText('Please log in to access this page.')).toBeInTheDocument()
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
  })

  test('blocks users without the admin role', () => {
    // GIVEN a regular user is logged in
    loginAs([UserRole.USER])

    // WHEN the guarded content renders
    renderGuard()

    // THEN a permission message replaces it
    expect(screen.getByText('You do not have permission to access the administration area.')).toBeInTheDocument()
    expect(screen.queryByText('admin content')).not.toBeInTheDocument()
  })

  test('shows the content to admins', () => {
    // GIVEN an admin is logged in
    loginAs([UserRole.ADMIN])

    // WHEN the guarded content renders
    renderGuard()

    // THEN the content is shown
    expect(screen.getByText('admin content')).toBeInTheDocument()
  })
})

describe('RequireLogin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('reads the user id from the token payload', () => {
    // GIVEN tokens with and without a readable payload
    const userToken = makeTestToken([UserRole.USER])

    // WHEN the user ids are read
    const userIds = [getUserIdFromToken(userToken), getUserIdFromToken('not-a-token'), getUserIdFromToken(null)]

    // THEN only the valid token yields an id
    expect(userIds).toEqual([1, null, null])
  })

  test('asks logged-out visitors to log in', () => {
    // GIVEN nobody is logged in
    // WHEN the guarded content renders
    render(<AuthProvider><RequireLogin><p>account content</p></RequireLogin></AuthProvider>)

    // THEN a login message replaces it
    expect(screen.getByText('Please log in to access this page.')).toBeInTheDocument()
    expect(screen.queryByText('account content')).not.toBeInTheDocument()
  })

  test('shows the content to any logged-in user', () => {
    // GIVEN a regular user is logged in
    loginAs([UserRole.USER])

    // WHEN the guarded content renders
    render(<AuthProvider><RequireLogin><p>account content</p></RequireLogin></AuthProvider>)

    // THEN the content is shown
    expect(screen.getByText('account content')).toBeInTheDocument()
  })

  test('lets admins and moderators moderate', () => {
    // GIVEN tokens for each role
    const tokens = [[UserRole.ADMIN], [UserRole.MODERATOR], [UserRole.USER]].map(makeTestToken)

    // WHEN checking who may moderate
    const allowed = [...tokens, null].map(canModerate)

    // THEN only admins and moderators may
    expect(allowed).toEqual([true, true, false, false])
  })

  test('shows moderation content to moderators and blocks regular users', () => {
    // GIVEN a regular user is logged in
    loginAs([UserRole.USER])

    // WHEN moderator-only content renders
    render(<AuthProvider><RequireModerator><p>moderation content</p></RequireModerator></AuthProvider>)

    // THEN an explanation replaces it
    expect(screen.getByText('You do not have permission to review change requests.')).toBeInTheDocument()
    expect(screen.queryByText('moderation content')).not.toBeInTheDocument()
  })
})
