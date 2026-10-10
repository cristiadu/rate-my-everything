import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import UserManagement from '@/components/admin/users/UserManagement'
import { AdminUser, UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'

/** Users returned by the mocked list endpoint. */
const users: AdminUser[] = [
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
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

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
})
