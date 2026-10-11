import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OverallRankings from '@/components/rankings/OverallRankings'
import { AuthProvider } from '@/components/users/AuthContext'
import { RankingScope, UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { alienRating, duneRating } from '@/components/tests/common/Interests'

/** Renders the rankings page for the given scope inside the auth provider and a router. */
const renderRankings = (scope: RankingScope) => render(
  <AuthProvider>
    <MemoryRouter>
      <OverallRankings scope={scope} />
    </MemoryRouter>
  </AuthProvider>,
)

describe('OverallRankings', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
  })

  test('shows my ratings with links to edit them', async () => {
    // GIVEN the API returns my ratings
    fetchMock.mockResolvedValue(jsonResponse([alienRating, duneRating]))

    // WHEN my rankings load
    renderRankings(RankingScope.MINE)

    // THEN they come from my ratings, best first, each with an edit link
    const rows = await screen.findAllByRole('row')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/ratings/mine'])
    expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks9.5Edit', 'AlienMovies7.0Edit'])
    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/interests/100/edit')
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/interests/new')
  })

  test('shows everyone\'s average ratings without edit links', async () => {
    // GIVEN the API returns two users' ratings of Dune
    fetchMock.mockResolvedValue(jsonResponse([duneRating, { ...duneRating, id: 902, rating: 6.5 }]))

    // WHEN the overall rankings load
    renderRankings(RankingScope.ALL)

    // THEN Dune shows once with its average rating
    expect(await screen.findByText('8.0')).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/ratings'])
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })

  test('tells users when they have not rated anything', async () => {
    // GIVEN the API returns no ratings
    fetchMock.mockResolvedValue(jsonResponse([]))

    // WHEN my rankings load
    renderRankings(RankingScope.MINE)

    // THEN an empty-state message is shown
    expect(await screen.findByText('You have not rated anything yet.')).toBeInTheDocument()
  })

  test('shows the API error message when loading fails', async () => {
    // GIVEN the API rejects the token
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid token' }, 401))

    // WHEN my rankings load
    renderRankings(RankingScope.MINE)

    // THEN the API message is shown
    expect(await screen.findByText('Invalid token')).toBeInTheDocument()
  })
})
