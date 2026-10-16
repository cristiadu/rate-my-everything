import React from 'react'
import { render, screen } from '@testing-library/react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { loginAs } from '@/components/tests/common/Auth'

describe('AdminDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('greets the signed-in admin and links to the users page', () => {
    // GIVEN an admin is logged in
    loginAs([UserRole.ADMIN])

    // WHEN the dashboard renders
    render(<AuthProvider><AdminDashboard /></AuthProvider>)

    // THEN it names the admin and links to user management
    expect(screen.getByRole('heading', { name: 'Admin Area' })).toBeInTheDocument()
    expect(screen.getByText('Signed in as admin.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
  })
})
