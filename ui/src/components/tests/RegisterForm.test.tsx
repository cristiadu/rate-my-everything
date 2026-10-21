import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RegisterForm from '@/components/users/RegisterForm'
import { UserRole } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Fills in the register form for dave, confirming the password with the given text, and submits it. */
const registerDave = (confirmPassword: string) => {
  fireEvent.change(inputUnderLabel('Username'), { target: { value: 'dave' } })
  fireEvent.change(inputUnderLabel('Email'), { target: { value: 'dave@example.com' } })
  fireEvent.change(inputUnderLabel('Password'), { target: { value: 'secret123' } })
  fireEvent.change(inputUnderLabel('Confirm Password'), { target: { value: confirmPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Register' }))
}

describe('RegisterForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('registers the account without roles and tells the page', async () => {
    // GIVEN the API creates the account
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 4, username: 'dave', email: 'dave@example.com', roles: [UserRole.USER] }, 201))
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    // WHEN dave registers with a matching password
    registerDave('secret123')

    // THEN the account is registered without roles and the page is told
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/login/register')
    expect(JSON.parse(String(options?.body))).toEqual({ username: 'dave', email: 'dave@example.com', password: 'secret123' })
  })

  test('stops when the two passwords differ', () => {
    // GIVEN the register form
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    // WHEN dave confirms a different password
    registerDave('another1')

    // THEN the mismatch is shown and nothing is sent
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('shows the API error when registering fails', async () => {
    // GIVEN the username is already taken
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Username already exists' }, 422))
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    // WHEN dave registers
    registerDave('secret123')

    // THEN the message is shown and the page is not told
    expect(await screen.findByText('Username already exists')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
