import { screen } from '@testing-library/react'
import UserRole from '@/components/users/UserRole'
import { signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('HeaderMenu', () => {
  test('shows the account and admin links to admins', () => {
    // GIVEN
    signInAs([UserRole.ADMIN])

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
  })

  test('shows only the account link to regular users', () => {
    // GIVEN
    signInAs([UserRole.USER])

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.getByRole('link', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  test('shows neither link to signed-out visitors', () => {
    // GIVEN no stored token

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.queryByRole('link', { name: 'My Account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })
})
