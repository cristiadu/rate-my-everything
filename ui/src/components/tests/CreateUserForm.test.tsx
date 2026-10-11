import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import CreateUserForm from '@/components/users/CreateUserForm'
import { AdminUser, UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'

/** Existing user passed to the form in edit mode. */
const bob: AdminUser = { id: 2, username: 'bob', email: 'bob@example.com', roles: [UserRole.USER] }

describe('CreateUserForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('creates a user and reports success', async () => {
    // GIVEN the create call succeeds
    const onSaved = jest.fn()
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 3, username: 'carol', email: 'carol@example.com', roles: [UserRole.USER] }, 201))
    render(<CreateUserForm onSaved={onSaved} />)

    // WHEN the form is filled in and submitted
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'carol' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carol@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the user is posted, the success message shows and the parent is told
    expect(await screen.findByText('User created successfully!')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/users')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'carol', email: 'carol@example.com', password: 'secret123', roles: ['user'],
    })
    expect(onSaved).toHaveBeenCalledWith({ id: 3, username: 'carol', email: 'carol@example.com', roles: ['user'] })
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

    // THEN the update omits the password
    expect(await screen.findByText('User updated successfully!')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/users/2')
    expect(options?.method).toBe('PUT')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'bob', email: 'bob@example.com', roles: ['user', 'moderator'],
    })
  })
})
