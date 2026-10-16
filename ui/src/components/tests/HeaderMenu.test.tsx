import React from 'react'
import { render, screen } from '@testing-library/react'
import HeaderMenu from '@/components/layout/HeaderMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
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

    // THEN the admin and moderation links are hidden and the import screen is linked
    expect(screen.getByText('My Account')).toBeInTheDocument()
    expect(screen.getByText('Import interests').closest('a')).toHaveAttribute('href', '/interests/import')
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Moderation')).not.toBeInTheDocument()
  })

  test('shows the moderation link to moderators who are not admins', () => {
    // GIVEN a moderator is logged in
    loginAs([UserRole.USER, UserRole.MODERATOR])

    // WHEN the menu renders
    renderMenu()

    // THEN moderation and their own requests are linked, but not the admin area
    expect(screen.getByText('Moderation').closest('a')).toHaveAttribute('href', '/moderation')
    expect(screen.getByText('My change requests').closest('a')).toHaveAttribute('href', '/change-requests')
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

  test('marks the current page and the admin menu as active', () => {
    // GIVEN an admin is on the users page
    loginAs([UserRole.ADMIN])
    window.history.pushState({}, '', '/admin/users')

    // WHEN the menu renders
    renderMenu()

    // THEN the users item and the admin menu are marked, and other items are not
    expect(screen.getByText('Users').closest('a')).toHaveClass('is-active')
    expect(screen.getByText('Admin').closest('a')).toHaveClass('is-active')
    expect(screen.getByText('My Account').closest('a')).not.toHaveClass('is-active')
  })
})
