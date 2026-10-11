import React from 'react'
import { render, screen } from '@testing-library/react'
import RequireAdmin from '@/components/admin/RequireAdmin'
import { AuthProvider } from '@/components/users/AuthContext'
import UserRole from '@api/models/UserRole'
import { loginAs } from '@/components/tests/common/Auth'

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

  test('asks logged-out visitors to log in', () => {
    // GIVEN nobody is logged in
    // WHEN the guarded content renders
    renderGuard()

    // THEN a login message replaces it
    expect(screen.getByText('Please log in to access the administration area.')).toBeInTheDocument()
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
