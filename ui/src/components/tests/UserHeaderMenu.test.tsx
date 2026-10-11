import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import UserHeaderMenu from '@/components/users/UserHeaderMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { makeTestToken } from '@/components/tests/common/Auth'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'

describe('UserHeaderMenu', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('logs the visitor in from the header form', async () => {
    // GIVEN the API accepts the credentials
    const token = makeTestToken([UserRole.USER])
    mockFetch().mockResolvedValue(jsonResponse({ token }))
    render(<AuthProvider><UserHeaderMenu /></AuthProvider>)

    // WHEN the visitor types their credentials and logs in
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'regular' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByText('Log In'))

    // THEN the header switches to the logged-in state and keeps the token
    expect(await screen.findByText('Log Out')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBe(token)
  })
})
