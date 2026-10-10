import { screen } from '@testing-library/react'
import UserRole from '@/components/users/UserRole'
import { signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('UserHeaderMenu', () => {
  test('shows the Admin link to admins', () => {
    // GIVEN
    signInAs([UserRole.ADMIN], { username: 'boss' })

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.getByText('Welcome, boss!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute('href', '/account')
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  test('hides the Admin link from regular users', () => {
    // GIVEN
    signInAs([UserRole.USER])

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.getByRole('link', { name: 'My Account' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })
})
