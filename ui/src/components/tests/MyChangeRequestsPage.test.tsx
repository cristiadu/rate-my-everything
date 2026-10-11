import React from 'react'
import { render, screen } from '@testing-library/react'
import MyChangeRequestsPage from '@/components/moderation/MyChangeRequestsPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { rejectedCategoryChange } from '@/components/tests/common/ChangeRequests'

describe('MyChangeRequestsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
  })

  test("shows the user's requests and the moderator's decision without review buttons", async () => {
    // GIVEN the API returns one rejected request
    mockFetch().mockImplementation(async (url) => jsonResponse(String(url).endsWith('/change-requests') ? [rejectedCategoryChange] : []))

    // WHEN the page loads
    render(<AuthProvider><MyChangeRequestsPage /></AuthProvider>)

    // THEN the request, its status and note are shown, and it cannot be reviewed here
    expect(await screen.findByText('Add category "Games"')).toBeInTheDocument()
    expect(screen.getByText('rejected')).toBeInTheDocument()
    expect(screen.getByText('Already covered by Hobbies')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  test('shows the API error message when loading fails', async () => {
    // GIVEN the API fails
    mockFetch().mockResolvedValue(jsonResponse({ message: 'Invalid token' }, 401))

    // WHEN the page loads
    render(<AuthProvider><MyChangeRequestsPage /></AuthProvider>)

    // THEN the message is shown
    expect(await screen.findByText('Invalid token')).toBeInTheDocument()
  })
})
