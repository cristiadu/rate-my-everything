import React from 'react'
import { render, screen } from '@testing-library/react'
import UserAccount from '@/components/account/UserAccount'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { loginAs } from '@/components/tests/common/Auth'

describe('UserAccount', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('shows the signed-in user\'s name and each of their roles', () => {
    // GIVEN a user with the user and moderator roles is logged in
    loginAs([UserRole.USER, UserRole.MODERATOR])

    // WHEN their account page renders
    render(<AuthProvider><UserAccount /></AuthProvider>)

    // THEN their username and both roles are shown
    expect(screen.getByRole('heading', { name: 'My account' })).toBeInTheDocument()
    expect(screen.getByText('Username: admin')).toBeInTheDocument()
    expect(screen.getByText('user')).toBeInTheDocument()
    expect(screen.getByText('moderator')).toBeInTheDocument()
  })
})
