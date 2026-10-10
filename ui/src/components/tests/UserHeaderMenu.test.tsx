import { screen } from '@testing-library/react'
import UserRole from '@/components/users/UserRole'
import { signInAs } from '@/components/tests/common/auth'
import { renderAppAt } from '@/components/tests/common/render'

beforeEach(() => {
  localStorage.clear()
})

describe('UserHeaderMenu', () => {
  test('welcomes the signed-in user by name', () => {
    // GIVEN
    signInAs([UserRole.USER], { username: 'regular' })

    // WHEN
    renderAppAt('/')

    // THEN
    expect(screen.getByText('Welcome, regular!')).toBeInTheDocument()
    expect(screen.getByText('Log Out')).toBeInTheDocument()
  })
})
