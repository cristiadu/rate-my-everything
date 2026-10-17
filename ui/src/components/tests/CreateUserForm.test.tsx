import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CreateUserForm from '@/components/users/CreateUserForm'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole, type UserResponse } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'

/** Renders the sign-up form on its own page, with a home page to land on afterwards. */
const renderSignUp = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<CreateUserForm isSignUp />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

/** Existing user passed to the form in edit mode. */
const bob: UserResponse = { id: 2, username: 'bob', email: 'bob@example.com', roles: [UserRole.USER] }

describe('CreateUserForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = mockFetch()
  })

  test('creates a user and reports success', async () => {
    // GIVEN the create call succeeds
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 3, username: 'carol', email: 'carol@example.com', roles: [UserRole.USER] }, 201))
    render(<CreateUserForm />)

    // WHEN the form is filled in and submitted
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'carol' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carol@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the user is posted and the success message shows
    expect(await screen.findByText('User created successfully!')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/users')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'carol', email: 'carol@example.com', password: 'secret123', roles: ['user'],
    })
  })

  test('shows the API error when creating fails', async () => {
    // GIVEN the create call is rejected
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Username already exists' }, 422))
    render(<CreateUserForm />)

    // WHEN the form is submitted
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bob@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the API's message is shown
    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
  })

  test('edits a user without sending a blank password', async () => {
    // GIVEN an existing user and a successful update call
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...bob, roles: [UserRole.USER, UserRole.MODERATOR] }))
    render(<CreateUserForm user={bob} />)

    // WHEN the moderator role is added and the form is saved
    fireEvent.click(screen.getByLabelText(/moderator/))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN the update omits the password and the success message shows
    expect(await screen.findByText('User updated successfully!')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/users/2')
    expect(options?.method).toBe('PUT')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'bob', email: 'bob@example.com', roles: ['user', 'moderator'],
    })
  })

  test('hands the edited values to the parent instead of calling the API', () => {
    // GIVEN the parent saves the values for an existing user
    const onSubmit = jest.fn()
    render(<CreateUserForm user={bob} onSubmit={onSubmit} />)

    // WHEN the moderator role is added and the form is saved
    fireEvent.click(screen.getByLabelText(/moderator/))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN the parent gets the values and the form makes no request
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'bob', email: 'bob@example.com', password: '', roles: ['user', 'moderator'],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  test('removes a role that is unticked', () => {
    // GIVEN the parent saves the values for bob, who has the user role
    const onSubmit = jest.fn()
    render(<CreateUserForm user={bob} onSubmit={onSubmit} />)

    // WHEN the moderator role is ticked, the user role unticked and the form saved
    fireEvent.click(screen.getByLabelText(/moderator/))
    fireEvent.click(screen.getByRole('checkbox', { name: 'user' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN only the moderator role is kept
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'bob', email: 'bob@example.com', password: '', roles: ['moderator'],
    })
  })

  test('closes through the parent when cancelled', () => {
    // GIVEN the form opened by a parent that can close it
    const onCancel = jest.fn()
    render(<CreateUserForm onCancel={onCancel} />)

    // WHEN Cancel is clicked
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the parent is told to close it
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('signs a visitor up, logs them in and sends them home', async () => {
    // GIVEN the API creates the account and then accepts its credentials
    const token = makeTestToken([UserRole.USER])
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 4, username: 'dave', email: 'dave@example.com', roles: [UserRole.USER] }, 201))
      .mockResolvedValueOnce(jsonResponse({ token }))
    renderSignUp()

    // WHEN the visitor fills in the form, which has no roles to pick, and submits it
    expect(screen.queryByText('Roles')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'dave' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dave@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // THEN the account is registered without roles, the visitor is logged in and lands on the home page
    expect(await screen.findByText('Home page')).toBeInTheDocument()
    const [registerUrl, registerOptions] = fetchMock.mock.calls[0]
    expect(registerUrl).toBe('http://localhost:3000/api/login/register')
    expect(JSON.parse(String(registerOptions?.body))).toEqual({
      username: 'dave', email: 'dave@example.com', password: 'secret123',
    })
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3000/api/login')
    expect(localStorage.getItem('authToken')).toBe(token)
  })

  test('shows the API error when signing up fails', async () => {
    // GIVEN the username is already taken
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Username already exists' }, 422))
    renderSignUp()

    // WHEN the visitor submits the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bob@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    // THEN the message is shown and the visitor stays logged out on the form
    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  test('sends a logged-in user away from the sign-up form', () => {
    // GIVEN a user who is already logged in
    loginAs([UserRole.USER])

    // WHEN they open the sign-up page
    renderSignUp()

    // THEN they land on the home page instead
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })
})
