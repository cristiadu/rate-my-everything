import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import UserManagement from '@/components/admin/users/UserManagement'
import { UserRole, type UserResponse } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'

/** Users returned by the mocked list endpoint. */
const users: UserResponse[] = [
  { id: 1, username: 'alice', email: 'alice@example.com', roles: [UserRole.ADMIN] },
  { id: 2, username: 'bob', email: 'bob@example.com', roles: [UserRole.USER] },
]

describe('UserManagement', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('lists users without showing passwords', async () => {
    // GIVEN the API returns two users
    fetchMock.mockResolvedValueOnce(jsonResponse(users))

    // WHEN the screen loads
    render(<UserManagement />)

    // THEN both users are listed and no password appears
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
  })

  test('creates a user with the selected roles', async () => {
    // GIVEN the list loads and the create call succeeds
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse({ id: 3, username: 'carol', email: 'carol@example.com', roles: [UserRole.USER] }, 201))
      .mockResolvedValueOnce(jsonResponse(users))
    render(<UserManagement />)

    // WHEN a new user is filled in and submitted
    fireEvent.click(await screen.findByRole('button', { name: 'New user' }))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'carol' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carol@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the user is posted with the default role and a success message shows
    expect(await screen.findByText('User carol created.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/users')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'carol', email: 'carol@example.com', password: 'secret123', roles: ['user'],
    })
  })

  test('edits a user without sending a blank password', async () => {
    // GIVEN the list loads and the update call succeeds
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse(users[1]))
      .mockResolvedValueOnce(jsonResponse(users))
    render(<UserManagement />)

    // WHEN bob gets the moderator role and the form is saved
    fireEvent.click((await screen.findAllByRole('button', { name: 'Edit' }))[1])
    fireEvent.click(screen.getByLabelText(/moderator/))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN the update omits the password and a success message shows
    expect(await screen.findByText('User bob updated.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/users/2')
    expect(options?.method).toBe('PUT')
    expect(JSON.parse(String(options?.body))).toEqual({
      username: 'bob', email: 'bob@example.com', roles: ['user', 'moderator'],
    })
  })

  test('deletes a user after confirmation', async () => {
    // GIVEN the admin confirms and the delete call succeeds
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse(null, 204))
      .mockResolvedValueOnce(jsonResponse([users[0]]))
    render(<UserManagement />)

    // WHEN bob is deleted
    fireEvent.click((await screen.findAllByRole('button', { name: 'Delete' }))[1])

    // THEN the delete is sent and bob leaves the list
    expect(await screen.findByText('User bob deleted.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument())
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/users/2')
    expect(options?.method).toBe('DELETE')
  })
  test('shows the API error when the users cannot be loaded', async () => {
    // GIVEN the API rejects the token
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid token' }, 401))

    // WHEN the screen loads
    render(<UserManagement />)

    // THEN the message is shown and no user is listed
    expect(await screen.findByText('Invalid token')).toBeInTheDocument()
    expect(screen.getByText('No users yet.')).toBeInTheDocument()
  })

  test('keeps the form open with the API error when saving fails', async () => {
    // GIVEN the list loads and the create call is rejected
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse({ error: 'Username already exists' }, 422))
    render(<UserManagement />)

    // WHEN a user named like an existing one is submitted
    fireEvent.click(await screen.findByRole('button', { name: 'New user' }))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bob2@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

    // THEN the API's message is shown and the form stays open
    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Create user' })).toBeInTheDocument()
  })

  test('closes the form when cancelled', async () => {
    // GIVEN the new-user form is open
    fetchMock.mockResolvedValueOnce(jsonResponse(users))
    render(<UserManagement />)
    fireEvent.click(await screen.findByRole('button', { name: 'New user' }))

    // WHEN Cancel is clicked
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the form closes and a new one can be opened again
    expect(screen.queryByRole('form', { name: 'Create user' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New user' })).toBeEnabled()
  })

  test('keeps a user when the admin cancels the deletion', async () => {
    // GIVEN the admin does not confirm
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    fetchMock.mockResolvedValueOnce(jsonResponse(users))
    render(<UserManagement />)

    // WHEN deleting bob
    fireEvent.click((await screen.findAllByRole('button', { name: 'Delete' }))[1])

    // THEN nothing is sent and bob stays listed
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  test('shows the API error when deleting fails', async () => {
    // GIVEN the admin confirms and the delete call is rejected
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse({ message: 'You cannot delete yourself' }, 403))
    render(<UserManagement />)

    // WHEN alice is deleted
    fireEvent.click((await screen.findAllByRole('button', { name: 'Delete' }))[0])

    // THEN the API's message is shown and alice stays listed
    expect(await screen.findByText('You cannot delete yourself')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })
})
