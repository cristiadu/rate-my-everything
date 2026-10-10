import { screen } from '@testing-library/react'
import UserRole from '@/components/users/UserRole'
import { signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('RequireAuth', () => {
  test('sends signed-out visitors to the login page', () => {
    // GIVEN no stored token

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  test('shows Not authorized to a user without the required role', () => {
    // GIVEN
    signInAs([UserRole.USER])

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByText('Not authorized')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Admin Area' })).not.toBeInTheDocument()
  })

  test('lets a user with the required role in', () => {
    // GIVEN
    signInAs([UserRole.ADMIN], { username: 'boss' })

    // WHEN
    renderAppAt('/admin')

    // THEN
    expect(screen.getByRole('heading', { name: 'Admin Area' })).toBeInTheDocument()
    expect(screen.getByText('Signed in as boss')).toBeInTheDocument()
  })

  test('lets any signed-in user into a page with no role requirement', () => {
    // GIVEN
    signInAs([UserRole.USER], { username: 'regular' })

    // WHEN
    renderAppAt('/account')

    // THEN
    expect(screen.getByRole('heading', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.getByText('Username: regular')).toBeInTheDocument()
  })
})
