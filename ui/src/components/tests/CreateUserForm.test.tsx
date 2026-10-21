import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import CreateUserForm from '@/components/users/CreateUserForm'
import { UserRole, type UserResponse } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'

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
    fireEvent.change(screen.getByLabelText('Repeat password'), { target: { value: 'secret123' } })
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
    fireEvent.change(screen.getByLabelText('Repeat password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the API's message is shown
    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
  })

  test('does not save when the repeated password differs', () => {
    // GIVEN the create form
    render(<CreateUserForm />)

    // WHEN the two passwords differ and the form is submitted
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'carol' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carol@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText('Repeat password'), { target: { value: 'secret124' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the mismatch is reported and nothing is sent
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
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
})
