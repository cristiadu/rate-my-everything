import React from 'react'
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react'
import ModerationPage from '@/components/moderation/ModerationPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { testAttributes, testCategories } from '@/components/tests/common/Categories'
import { pendingItemChange, rejectedCategoryChange } from '@/components/tests/common/ChangeRequests'

/** API base URL the UI calls. */
const API_URL = 'http://localhost:3000/api'

/** Answers the lookups and moderation list endpoints; the list depends on the status filter. */
const respond = async (url: RequestInfo | URL) => {
  const path = String(url).replace(API_URL, '')
  if (path === '/categories') return jsonResponse(testCategories)
  if (path === '/attributes') return jsonResponse(testAttributes)
  if (path === '/moderation/change-requests?status=pending') return jsonResponse([pendingItemChange])
  if (path === '/moderation/change-requests') return jsonResponse([pendingItemChange, rejectedCategoryChange])
  return jsonResponse({ ...pendingItemChange, status: 'approved' })
}

/** Renders the moderation page inside the auth provider. */
const renderPage = () => render(
  <AuthProvider>
    <ModerationPage />
  </AuthProvider>,
)

describe('ModerationPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER, UserRole.MODERATOR])
    fetchMock = mockFetch()
    fetchMock.mockImplementation(respond)
  })

  test('lists pending requests with their proposed values', async () => {
    // GIVEN one pending interest edit
    // WHEN the page loads
    renderPage()

    // THEN the request shows what it changes, who sent it and named values
    expect(await screen.findByText('Edit interest "Dune"')).toBeInTheDocument()
    expect(screen.getByText('by alice')).toBeInTheDocument()
    expect(await screen.findByText('Books')).toBeInTheDocument()
    expect(screen.getByText('Pages: 420')).toBeInTheDocument()
  })

  test('approves a request with a note and reloads the list', async () => {
    // GIVEN a moderator who enters a note when approving
    jest.spyOn(window, 'prompt').mockReturnValue('Looks right')
    renderPage()
    const row = (await screen.findByText('Edit interest "Dune"')).closest('tr') as HTMLElement

    // WHEN approving it
    fireEvent.click(within(row).getByRole('button', { name: 'Approve' }))

    // THEN the approval is sent with the note and confirmed
    expect(await screen.findByText('Edit interest "Dune" approved.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT') ?? []
    expect(url).toBe(`${API_URL}/moderation/change-requests/1/approve`)
    expect(JSON.parse(String(options?.body))).toEqual({ reviewNote: 'Looks right' })
  })

  test('does nothing when the moderator cancels the prompt', async () => {
    // GIVEN a moderator who cancels the note prompt
    jest.spyOn(window, 'prompt').mockReturnValue(null)
    renderPage()
    const row = (await screen.findByText('Edit interest "Dune"')).closest('tr') as HTMLElement

    // WHEN rejecting
    fireEvent.click(within(row).getByRole('button', { name: 'Reject' }))

    // THEN nothing is sent
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  test('shows reviewed requests without review buttons when listing all', async () => {
    // GIVEN the page
    renderPage()
    await screen.findByText('Edit interest "Dune"')

    // WHEN switching the filter to all statuses
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'all' } })

    // THEN the rejected request shows its reviewer and note, and only the pending one can be reviewed
    expect(await screen.findByText('Already covered by Hobbies')).toBeInTheDocument()
    expect(screen.getByText('by mod')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(1))
  })
})
