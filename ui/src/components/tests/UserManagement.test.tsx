import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import RequireAdmin, { getRolesFromToken } from '@/components/admin/RequireAdmin'
import UserManagement from '@/components/admin/users/UserManagement'
import { AuthProvider } from '@/components/users/AuthContext'
import { AdminUser, UserRole } from '@/components/types'
import { loginAs, makeTestToken } from '@/components/tests/common/Auth'

const users: AdminUser[] = [
  { id: 1, username: 'alice', email: 'alice@example.com', roles: [UserRole.ADMIN] },
  { id: 2, username: 'bob', email: 'bob@example.com', roles: [UserRole.USER] },
]

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status < 400,
  status,
  headers: { get: () => 'application/json' },
  json: async () => body,
  text: async () => JSON.stringify(body),
})

const renderAdminUsers = () => render(
  <AuthProvider>
    <RequireAdmin>
      <UserManagement />
    </RequireAdmin>
  </AuthProvider>,
)

describe('Admin user management', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    localStorage.clear()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  test('reads roles from the token payload', () => {
    expect(getRolesFromToken(makeTestToken([UserRole.ADMIN]))).toEqual([UserRole.ADMIN])
    expect(getRolesFromToken('not-a-token')).toEqual([])
    expect(getRolesFromToken(null)).toEqual([])
  })

  test('blocks users without the admin role', () => {
    loginAs([UserRole.USER])
    renderAdminUsers()
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('lists users without showing passwords', async () => {
    loginAs([UserRole.ADMIN])
    fetchMock.mockResolvedValueOnce(jsonResponse(users))
    renderAdminUsers()

    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
  })

  test('creates a user with the selected roles', async () => {
    loginAs([UserRole.ADMIN])
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse({ id: 3, username: 'carol', email: 'carol@example.com', roles: [UserRole.USER] }, 201))
      .mockResolvedValueOnce(jsonResponse(users))
    renderAdminUsers()

    fireEvent.click(await screen.findByRole('button', { name: 'New user' }))
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'carol' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carol@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    expect(await screen.findByText('User carol created.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/users$/)
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      username: 'carol', email: 'carol@example.com', password: 'secret123', roles: [UserRole.USER],
    })
  })

  test('edits a user without sending a blank password', async () => {
    loginAs([UserRole.ADMIN])
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse(users[1]))
      .mockResolvedValueOnce(jsonResponse(users))
    renderAdminUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Edit' }))[1])
    fireEvent.click(screen.getByLabelText(/moderator/))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('User bob updated.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/users\/2$/)
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({
      username: 'bob', email: 'bob@example.com', roles: [UserRole.USER, UserRole.MODERATOR],
    })
  })

  test('deletes a user after confirmation', async () => {
    loginAs([UserRole.ADMIN])
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(users))
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
      .mockResolvedValueOnce(jsonResponse([users[0]]))
    renderAdminUsers()

    fireEvent.click((await screen.findAllByRole('button', { name: 'Delete' }))[1])

    expect(await screen.findByText('User bob deleted.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument())
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/users\/2$/)
    expect(options.method).toBe('DELETE')
  })
})
