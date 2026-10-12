import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InterestPage from '@/components/interests/InterestPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { myComment } from '@/components/tests/common/Comments'
import { duneItem } from '@/components/tests/common/Interests'

/** Renders the interest page route at the given path. */
const renderPageAt = (path: string) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/interests/:itemId" element={<InterestPage />} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('InterestPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
  })

  test('shows the interest details and its discussion', async () => {
    // GIVEN the API returns Dune and one comment on it
    fetchMock.mockImplementation(async (url) => {
      const requestUrl = String(url)
      if (requestUrl.includes('/comments/')) return jsonResponse([myComment])
      if (requestUrl.includes('/ratings/')) return jsonResponse([])
      return jsonResponse(duneItem)
    })

    // WHEN Dune's page opens
    renderPageAt('/interests/100')

    // THEN its details, attribute values and discussion are shown
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByText('Desert planet epic')).toBeInTheDocument()
    expect(screen.getByText('Pages')).toBeInTheDocument()
    expect(screen.getByText('412')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByText('Everyone\'s grade')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'My ratings' })).toBeInTheDocument()
    expect(await screen.findByText('Best sci-fi ever written')).toBeInTheDocument()
  })

  test('shows the API error when the interest does not exist', async () => {
    // GIVEN the API reports the item missing
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Item not found' }, 404))

    // WHEN a missing interest's page opens
    renderPageAt('/interests/999')

    // THEN the error is shown instead of a discussion
    expect(await screen.findByText('Item not found')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Discussion' })).not.toBeInTheDocument()
  })
})
