import React from 'react'
import { screen } from '@testing-library/react'
import ApiService from '@/config/ApiService'
import OverallRankings from '@/components/rankings/OverallRankings'
import { RankingScope, UserRole } from '@/components/types'
import { renderAsUser } from '@/components/tests/common/auth'
import { alienRating, duneRating } from '@/components/tests/common/interestFixtures'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
})

test('shows my ratings with links to edit them', async () => {
  // GIVEN the API returns my ratings
  mockedApi.get.mockResolvedValue([alienRating, duneRating])

  // WHEN my rankings load
  renderAsUser(<OverallRankings scope={RankingScope.MINE} />, [UserRole.USER])

  // THEN they come from my ratings, best first, each with an edit link
  const rows = await screen.findAllByRole('row')
  expect(mockedApi.get).toHaveBeenCalledWith('/ratings/mine')
  expect(rows.slice(1).map((row) => row.textContent)).toEqual(['DuneBooks9.5Edit', 'AlienMovies7.0Edit'])
  expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/interests/100/edit')
  expect(screen.getByRole('link', { name: 'Add interest' })).toHaveAttribute('href', '/interests/new')
})

test('shows everyone\'s average ratings without edit links', async () => {
  // GIVEN the API returns ratings from every user
  mockedApi.get.mockResolvedValue([duneRating, { ...duneRating, id: 902, rating: 6.5 }])

  // WHEN the overall rankings load
  renderAsUser(<OverallRankings scope={RankingScope.ALL} />, [UserRole.USER])

  // THEN Dune shows once with its average rating
  expect(await screen.findByText('8.0')).toBeInTheDocument()
  expect(mockedApi.get).toHaveBeenCalledWith('/ratings')
  expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
})

test('tells users when they have not rated anything', async () => {
  mockedApi.get.mockResolvedValue([])

  renderAsUser(<OverallRankings scope={RankingScope.MINE} />, [UserRole.USER])

  expect(await screen.findByText('You have not rated anything yet.')).toBeInTheDocument()
})

test('shows the API error message when loading fails', async () => {
  mockedApi.get.mockRejectedValue(new Error('Invalid token'))

  renderAsUser(<OverallRankings scope={RankingScope.MINE} />, [UserRole.USER])

  expect(await screen.findByText('Invalid token')).toBeInTheDocument()
})
