import React from 'react'
import { render, screen } from '@testing-library/react'
import HeaderMenu from '@/components/layout/HeaderMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { loginAs } from '@/components/tests/common/Auth'

/** Renders the top menu inside the auth provider. */
const renderMenu = () => render(
  <AuthProvider>
    <HeaderMenu />
  </AuthProvider>,
)

describe('HeaderMenu', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('shows the account and admin links to admins', () => {
    // GIVEN an admin is logged in
    loginAs([UserRole.ADMIN])

    // WHEN the menu renders
    renderMenu()

    // THEN both areas are linked
    expect(screen.getByText('My Account').closest('a')).toHaveAttribute('href', '/account')
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/admin')
    expect(screen.getByText('Users').closest('a')).toHaveAttribute('href', '/admin/users')
  })

  test('shows only the account link to regular users', () => {
    // GIVEN a regular user is logged in
    loginAs([UserRole.USER])

    // WHEN the menu renders
    renderMenu()

    // THEN the admin links are hidden and the import screen is linked
    expect(screen.getByText('My Account')).toBeInTheDocument()
    expect(screen.getByText('Import interests').closest('a')).toHaveAttribute('href', '/interests/import')
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  test('shows neither link to logged-out visitors', () => {
    // GIVEN nobody is logged in
    // WHEN the menu renders
    renderMenu()

    // THEN no area links are shown
    expect(screen.queryByText('My Account')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})
