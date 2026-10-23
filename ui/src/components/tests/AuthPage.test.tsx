import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthPage from '@/components/users/AuthPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import type { AuthTab } from '@/components/types'
import { emptyResponse, jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Renders the account page on /register (with the query string given), with a home page to land on once logged in. */
const renderAuthPage = (initialTab?: AuthTab, query = '') => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[`/register${query}`]}>
      <Routes>
        <Route path="/register" element={<AuthPage initialTab={initialTab} />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('AuthPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = mockFetch()
  })

  test('opens on the login form by default', () => {
    // GIVEN a visitor
    // WHEN the account page opens without a tab
    renderAuthPage()

    // THEN the login form is shown
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  test('opens on the register form when asked, and switches to login once the account exists', async () => {
    // GIVEN the API creates the account
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 4, username: 'dave', email: 'dave@example.com', roles: [UserRole.USER] }, 201))
    renderAuthPage('register')

    // WHEN the visitor registers
    fireEvent.change(inputUnderLabel('Username'), { target: { value: 'dave' } })
    fireEvent.change(inputUnderLabel('Email'), { target: { value: 'dave@example.com' } })
    fireEvent.change(inputUnderLabel('Password'), { target: { value: 'secret123' } })
    fireEvent.change(inputUnderLabel('Confirm Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    // THEN the login form is shown so they can log in
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  test('switches between the login and register tabs', () => {
    // GIVEN the account page on its login tab
    renderAuthPage()

    // WHEN the visitor picks the Register tab
    fireEvent.click(screen.getByText('Register', { selector: 'a' }))

    // THEN the register form is shown
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument()
  })

  test('logs the visitor in and sends them home', async () => {
    // GIVEN the API accepts the credentials
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: makeTestToken([UserRole.USER]) }))
    renderAuthPage()

    // WHEN the visitor logs in
    fireEvent.change(inputUnderLabel('Username'), { target: { value: 'dave' } })
    fireEvent.change(inputUnderLabel('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    // THEN they land on the home page
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  test('sends a logged-in user home', () => {
    // GIVEN a user who is already logged in
    loginAs([UserRole.USER])

    // WHEN they open the account page
    renderAuthPage('register')

    // THEN they land on the home page instead
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  test('opens the forgot password form from the login form, under the Login tab, and goes back on Cancel', () => {
    // GIVEN the account page on its login tab
    renderAuthPage()

    // WHEN the visitor follows the forgot password link
    fireEvent.click(screen.getByText('Forgot password?'))

    // THEN the forgot password form is shown under the Login tab
    expect(screen.getByRole('heading', { name: 'Forgot password' })).toBeInTheDocument()
    expect(screen.getByText('Login', { selector: 'a' }).closest('li')).toHaveClass('is-active')

    // WHEN they cancel
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the login form is back
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  test('asks the visitor to log in once the reset link changed their password', async () => {
    // GIVEN the account page opened from a reset link, and the API accepts its token
    fetchMock.mockResolvedValueOnce(emptyResponse())
    renderAuthPage('resetPassword', '?token=reset-token_123')

    // WHEN the visitor saves a new password
    fireEvent.change(inputUnderLabel('New password'), { target: { value: 'new-secret456' } })
    fireEvent.change(inputUnderLabel('Confirm new password'), { target: { value: 'new-secret456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }))

    // THEN the login form is shown with a note that the password changed
    expect(await screen.findByText('Your password was changed. Log in with your new password.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })
})
