import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FilterMenu from '@/components/filters/FilterMenu'
import OverallRankings from '@/components/rankings/OverallRankings'
import { FilterProvider } from '@/components/filters/FilterContext'
import { AuthProvider } from '@/components/users/AuthContext'
import { RankingScope, UserRole } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import {
  booksCategory, duneRating, filmsCategory, moviesCategory,
} from '@/components/tests/common/Interests'

/** Renders the filter panel next to the all rankings page, sharing the applied filters. */
const renderFilteredRankings = () => render(
  <AuthProvider>
    <FilterProvider>
      <MemoryRouter>
        <FilterMenu topOffset={0} />
        <OverallRankings scope={RankingScope.ALL} />
      </MemoryRouter>
    </FilterProvider>
  </AuthProvider>,
)

describe('FilterMenu', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
  })

  test('applies the filters through the ratings API and clears them', async () => {
    // GIVEN the API lists Books and Movies, returns Dune without filters, and nothing for the filtered query
    fetchMock.mockImplementation(async (url) => {
      if (String(url).endsWith('/categories')) {
        return jsonResponse([booksCategory, moviesCategory])
      }
      return jsonResponse(String(url).endsWith('?scope=all') ? [duneRating] : [])
    })
    renderFilteredRankings()
    await screen.findByLabelText('Books')

    // WHEN a name, the Books category, an author and a lowest grade are applied
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Dune' } })
    fireEvent.click(screen.getByLabelText('Books'))
    fireEvent.change(screen.getByLabelText('Author'), { target: { value: 'Herbert' } })
    fireEvent.change(screen.getByLabelText('Lowest grade'), { target: { value: '6' } })
    fireEvent.click(screen.getByText('Apply'))

    // THEN the rankings are asked for with those filters and nothing matches
    expect(await screen.findByText('No interests match the filters.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain(
      'http://localhost:3000/api/ratings?scope=all&name=Dune&categoryId=10&attribute=1%3AHerbert&minGrade=6',
    )

    // WHEN the filters are cleared
    fireEvent.click(screen.getByText('Clear'))

    // THEN the panel is empty and every ranking is listed again
    expect(await screen.findByRole('link', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.queryByLabelText('Author')).not.toBeInTheDocument()
  })

  test('shows every attribute of the chosen categories, picking the input from each value type', async () => {
    // GIVEN Books with Author (text), Pages (number) and Finished (yes/no), and Films with Released (date)
    fetchMock.mockImplementation(async (url) => jsonResponse(String(url).endsWith('/categories') ? [booksCategory, filmsCategory] : []))
    renderFilteredRankings()

    // WHEN both categories are chosen
    fireEvent.click(await screen.findByLabelText('Books'))
    fireEvent.click(screen.getByLabelText('Films'))

    // THEN every attribute of both is shown, each with the input for its value type
    expect(screen.getByLabelText('Author')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Pages')).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText('Finished')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByLabelText('Released')).toHaveAttribute('type', 'date')
  })

  test('shows the API error when the categories cannot be loaded', async () => {
    // GIVEN the API rejects every request
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid token' }, 401))

    // WHEN the panel renders
    renderFilteredRankings()

    // THEN the message is shown in the panel and on the page
    await waitFor(() => expect(screen.getAllByText('Invalid token')).toHaveLength(2))
  })
})
