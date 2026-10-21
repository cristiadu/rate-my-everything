import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import UserHeaderMenu from '@/components/users/UserHeaderMenu'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'
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
  test('shows the API error when the credentials are wrong', async () => {
    // GIVEN the API rejects the credentials
    mockFetch().mockResolvedValue(jsonResponse({ message: 'Invalid username or password' }, 401))
    render(<AuthProvider><UserHeaderMenu /></AuthProvider>)

    // WHEN the visitor logs in with a wrong password
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'regular' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText('Log In'))

    // THEN the API's message is shown and the visitor stays logged out
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(screen.getByText('Welcome, visitor')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  test('does not call the API until both credentials are typed', () => {
    // GIVEN the header form with only a username typed
    const fetchMock = mockFetch()
    render(<AuthProvider><UserHeaderMenu /></AuthProvider>)
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'regular' } })

    // WHEN the visitor tries to log in
    fireEvent.click(screen.getByText('Log In'))

    // THEN no login request is sent
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('links the New Account button to the sign-up page', () => {
    // GIVEN a logged-out visitor
    render(<AuthProvider><UserHeaderMenu /></AuthProvider>)

    // WHEN they look at the New Account button
    const newAccount = screen.getByRole('link', { name: 'New Account' })

    // THEN it opens the sign-up page
    expect(newAccount).toHaveAttribute('href', '/register')
  })

  test('logs the user out and forgets the token', () => {
    // GIVEN a logged-in user
    loginAs([UserRole.USER])
    render(<AuthProvider><UserHeaderMenu /></AuthProvider>)
    expect(screen.getByText('admin')).toBeInTheDocument()

    // WHEN they log out
    fireEvent.click(screen.getByText('Log Out'))

    // THEN the header shows the login form again and the token is removed
    expect(screen.getByText('Welcome, visitor')).toBeInTheDocument()
    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})
