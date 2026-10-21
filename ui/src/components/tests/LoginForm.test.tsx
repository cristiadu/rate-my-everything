import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LoginForm from '@/components/users/LoginForm'
import { UserRole } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { makeTestToken } from '@/components/tests/common/Auth'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Fills in the login form with bob's credentials and submits it. */
const submitBobsCredentials = () => {
  fireEvent.change(inputUnderLabel('Username'), { target: { value: 'bob' } })
  fireEvent.change(inputUnderLabel('Password'), { target: { value: 'secret123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Login' }))
}

describe('LoginForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = mockFetch()
  })

  test('logs the user in and hands the token to the page', async () => {
    // GIVEN the API accepts bob's credentials
    const token = makeTestToken([UserRole.USER])
    fetchMock.mockResolvedValueOnce(jsonResponse({ token }))
    const onSuccess = jest.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    // WHEN bob logs in
    submitBobsCredentials()

    // THEN the credentials are sent, the token is stored and the page is told
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(token))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/login')
    expect(JSON.parse(String(options?.body))).toEqual({ username: 'bob', password: 'secret123' })
    expect(localStorage.getItem('authToken')).toBe(token)
  })

  test('shows the API error when the credentials are wrong', async () => {
    // GIVEN the API rejects the credentials
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Invalid credentials' }, 401))
    const onSuccess = jest.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    // WHEN bob logs in
    submitBobsCredentials()

    // THEN the message is shown and nobody is logged in
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})
