import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ResetPasswordForm from '@/components/users/ResetPasswordForm'
import { emptyResponse, jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Renders the reset password form as the emailed link opens it, with the given callbacks. */
const renderFromResetLink = (onSuccess: () => void, onCancel: () => void = jest.fn()) => render(
  <MemoryRouter initialEntries={['/reset-password?token=reset-token_123']}>
    <ResetPasswordForm onSuccess={onSuccess} onCancel={onCancel} />
  </MemoryRouter>,
)

/** Types the new password, confirming it with the given text, and saves it. */
const saveNewPassword = (confirmPassword: string) => {
  fireEvent.change(inputUnderLabel('New password'), { target: { value: 'new-secret456' } })
  fireEvent.change(inputUnderLabel('Confirm new password'), { target: { value: confirmPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }))
}

describe('ResetPasswordForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('sends the link token with the new password and tells the page', async () => {
    // GIVEN the API accepts the token
    fetchMock.mockResolvedValueOnce(emptyResponse())
    const onSuccess = jest.fn()
    renderFromResetLink(onSuccess)

    // WHEN the new password is saved
    saveNewPassword('new-secret456')

    // THEN the token and password are sent and the page is told
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/login/password-reset/confirm')
    expect(JSON.parse(String(options?.body))).toEqual({ token: 'reset-token_123', password: 'new-secret456' })
  })

  test('shows the API error when the link has expired', async () => {
    // GIVEN the API rejects the token
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'This reset link is invalid or has expired' }, 400))
    const onSuccess = jest.fn()
    renderFromResetLink(onSuccess)

    // WHEN the new password is saved
    saveNewPassword('new-secret456')

    // THEN the message is shown and the page is not told
    expect(await screen.findByText('This reset link is invalid or has expired')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('does not call the API when the passwords differ', () => {
    // GIVEN the reset form
    renderFromResetLink(jest.fn())

    // WHEN the confirmation does not match
    saveNewPassword('something-else')

    // THEN the mismatch is shown without calling the API
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('goes back to the login form on Cancel', () => {
    // GIVEN the reset form
    const onCancel = jest.fn()
    renderFromResetLink(jest.fn(), onCancel)

    // WHEN the visitor cancels
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the page is told to go back
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
