import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ForgotPasswordForm from '@/components/users/ForgotPasswordForm'
import { emptyResponse, jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { inputUnderLabel } from '@/components/tests/common/Forms'

/** Types ada's email into the forgot password form and sends it. */
const sendAdasEmail = () => {
  fireEvent.change(inputUnderLabel('Email'), { target: { value: 'ada@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
}

describe('ForgotPasswordForm', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('asks the API for a reset link and says it is on its way', async () => {
    // GIVEN the API accepts the request
    fetchMock.mockResolvedValueOnce(emptyResponse())
    render(<ForgotPasswordForm onBack={jest.fn()} />)

    // WHEN ada sends her email
    sendAdasEmail()

    // THEN the email is sent to the API and the form says a link is coming
    expect(await screen.findByText(/If an account uses ada@example.com, a link to choose a new password is on its way/)).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/login/password-reset')
    expect(JSON.parse(String(options?.body))).toEqual({ email: 'ada@example.com' })
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument()
  })

  test('shows the API error when the request fails', async () => {
    // GIVEN the API refuses the request
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Too many requests, try again later' }, 429))
    render(<ForgotPasswordForm onBack={jest.fn()} />)

    // WHEN ada sends her email
    sendAdasEmail()

    // THEN the message is shown and the form stays
    expect(await screen.findByText('Too many requests, try again later')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
  })

  test('goes back to the login form on Cancel', () => {
    // GIVEN the forgot password form
    const onBack = jest.fn()
    render(<ForgotPasswordForm onBack={onBack} />)

    // WHEN the visitor cancels
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the page is told to go back, without calling the API
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
