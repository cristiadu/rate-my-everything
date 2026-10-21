import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthPage from '@/components/users/AuthPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import type { AuthTab } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Renders the account page on /register, with a home page to land on once logged in. */
const renderAuthPage = (initialTab?: AuthTab) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/register']}>
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
})
