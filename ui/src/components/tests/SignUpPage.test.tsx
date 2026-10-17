import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignUpPage from '@/components/users/SignUpPage'

describe('SignUpPage', () => {
  test('shows the sign-up form under its heading', () => {
    // GIVEN a logged-out visitor
    localStorage.clear()

    // WHEN they open the sign-up page
    render(<MemoryRouter><SignUpPage /></MemoryRouter>)

    // THEN the heading and the account form without roles are shown
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.queryByText('Roles')).not.toBeInTheDocument()
  })
})
