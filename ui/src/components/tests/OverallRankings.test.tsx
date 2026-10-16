import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OverallRankings from '@/components/rankings/OverallRankings'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { RankingScope } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import {
  alienRating, duneRating, duneRerating, otherUserDuneRating,
} from '@/components/tests/common/Interests'

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

  test('shows the items I rated with both grades and links to edit them', async () => {
    // GIVEN the API returns everyone's ratings, where I rated Dune twice
    fetchMock.mockResolvedValue(jsonResponse([alienRating, duneRating, duneRerating, otherUserDuneRating]))

    // WHEN my rankings load
    renderRankings(RankingScope.MINE)

    // THEN only Dune shows, with my grade, everyone's grade, its rating count and an edit link
    const rows = await screen.findAllByRole('row')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/ratings'])
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent))
      .toEqual(['Image', 'Name', 'Category', 'My grade', 'Everyone\'s grade', 'Ratings', ''])
    expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks9.07.53Edit'])
    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/interests/100/edit')
    expect(screen.getByRole('link', { name: 'Dune' })).toHaveAttribute('href', '/interests/100')
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/interests/new')
  })

  test('shows every rated item with both grades and without edit links', async () => {
    // GIVEN the API returns everyone's ratings, where I did not rate Alien
    fetchMock.mockResolvedValue(jsonResponse([alienRating, duneRating, duneRerating, otherUserDuneRating]))

    // WHEN the overall rankings load
    renderRankings(RankingScope.ALL)

    // THEN items are ordered by everyone's grade, and Alien has no grade of mine
    const rows = await screen.findAllByRole('row')
    expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks9.07.53', 'AlienMovies-7.01'])
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
