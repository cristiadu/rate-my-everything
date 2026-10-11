import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OverallRankings from '@/components/rankings/OverallRankings'
import { AuthProvider } from '@/components/users/AuthContext'
import { RankingScope, UserRole } from '@/components/types'
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

  test('shows my personal grades with links to edit them', async () => {
    // GIVEN the API returns my ratings, two of them for Dune
    fetchMock.mockResolvedValue(jsonResponse([alienRating, duneRating, duneRerating]))

    // WHEN my rankings load
    renderRankings(RankingScope.MINE)

    // THEN each item shows once with my grade and number of ratings, best first, each with an edit link
    const rows = await screen.findAllByRole('row')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/ratings/mine'])
    expect(screen.getByRole('columnheader', { name: 'My grade' })).toBeInTheDocument()
    expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks9.02Edit', 'AlienMovies7.01Edit'])
    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/interests/100/edit')
    expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/interests/new')
  })

  test('shows collective grades without edit links', async () => {
    // GIVEN the API returns my two ratings of Dune and another user's
    fetchMock.mockResolvedValue(jsonResponse([duneRating, duneRerating, otherUserDuneRating]))

    // WHEN the overall rankings load
    renderRankings(RankingScope.ALL)

    // THEN Dune shows once with the average of each user's grade and its three ratings
    const rows = await screen.findAllByRole('row')
    expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks7.53'])
    expect(screen.getByRole('columnheader', { name: 'Grade' })).toBeInTheDocument()
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
