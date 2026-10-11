import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InterestFormPage from '@/components/interests/InterestFormPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import {
  booksCategory, duneItem, duneRating, moviesCategory,
} from '@/components/tests/common/Interests'

/** API base URL the UI calls. */
const API_URL = 'http://localhost:3000/api'

/** Responses of the mocked endpoints, keyed by method and path. */
const responses: Record<string, object> = {
  'GET /categories': [booksCategory, moviesCategory],
  'GET /items/100': duneItem,
  'GET /ratings/mine': [duneRating],
  'POST /items': { ...duneItem, id: 101 },
  'PUT /items/100': duneItem,
}

/** Answers a mocked request from the responses table, or with an empty object. */
const respond = async (url: RequestInfo | URL, init?: RequestInit) => (
  jsonResponse(responses[`${init?.method} ${String(url).replace(API_URL, '')}`] ?? {})
)

/** Lists the writes the page sent, as [method, path, body]. */
const sentWrites = (fetchMock: jest.MockedFunction<typeof fetch>) => fetchMock.mock.calls
  .filter(([, init]) => init?.method !== 'GET')
  .map(([url, init]) => [init?.method, String(url).replace(API_URL, ''), JSON.parse(String(init?.body ?? 'null'))])

/** Renders the form routes at the given path, with a stand-in for the rankings page it returns to. */
const renderFormAt = (path: string) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/interests/new" element={<InterestFormPage />} />
        <Route path="/interests/:itemId/edit" element={<InterestFormPage />} />
        <Route path="/rankings" element={<p>My rankings page</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('InterestFormPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
    fetchMock.mockImplementation(respond)
  })

  test('adds an interest with its category attributes and my rating', async () => {
    // GIVEN the new-interest form with Books chosen
    renderFormAt('/interests/new')
    await screen.findByRole('option', { name: 'Books' })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '10' } })

    // WHEN the fields, Books attributes and rating are filled in and saved
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Hyperion' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Pilgrims and the Shrike' } })
    fireEvent.change(screen.getByLabelText('Pages'), { target: { value: '482' } })
    fireEvent.click(screen.getByLabelText('Finished'))
    fireEvent.change(screen.getByLabelText('My rating (0 to 10)'), { target: { value: '8.5' } })
    fireEvent.change(screen.getByLabelText('My notes'), { target: { value: 'Great frame story' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add interest' }))

    // THEN the item and then my rating of it are created, and the form returns to my rankings
    expect(await screen.findByText('My rankings page')).toBeInTheDocument()
    expect(sentWrites(fetchMock)).toEqual([
      ['POST', '/items', {
        name: 'Hyperion',
        description: 'Pilgrims and the Shrike',
        imageUrl: null,
        categoryId: 10,
        attributeValues: [{ attributeId: 2, value: '482' }, { attributeId: 3, value: 'true' }],
      }],
      ['POST', '/ratings', { item_id: 101, rating: 8.5, notes: 'Great frame story' }],
    ])
  })

  test('only shows the attributes of the chosen category', async () => {
    // GIVEN the new-interest form
    renderFormAt('/interests/new')
    await screen.findByRole('option', { name: 'Movies' })

    // WHEN Movies, which has no attributes, is chosen
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '20' } })

    // THEN no Books fields are shown
    expect(screen.getByLabelText('Category')).toHaveValue('20')
    expect(screen.queryByLabelText('Pages')).not.toBeInTheDocument()
    expect(screen.queryByText('Movies details')).not.toBeInTheDocument()
  })

  test('edits an interest and my existing rating of it', async () => {
    // GIVEN the edit form for Dune, filled from the API
    renderFormAt('/interests/100/edit')
    expect(await screen.findByDisplayValue('412')).toBeInTheDocument()
    expect(screen.getByLabelText('My rating (0 to 10)')).toHaveValue(9.5)

    // WHEN the page count and rating change and are saved
    fireEvent.change(screen.getByLabelText('Pages'), { target: { value: '420' } })
    fireEvent.change(screen.getByLabelText('My rating (0 to 10)'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

    // THEN the item and my rating are updated in place
    expect(await screen.findByText('My rankings page')).toBeInTheDocument()
    expect(sentWrites(fetchMock)).toEqual([
      ['PUT', '/items/100', {
        name: 'Dune',
        description: 'Desert planet epic',
        imageUrl: 'https://example.com/dune.png',
        categoryId: 10,
        attributeValues: [{ attributeId: 2, value: '420' }],
      }],
      ['PUT', '/ratings/900', { rating: 9, notes: 'Reread every year' }],
    ])
  })

  test('removes the interest from my list by deleting my rating', async () => {
    // GIVEN the edit form for Dune and a confirmed removal
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    renderFormAt('/interests/100/edit')

    // WHEN it is removed
    fireEvent.click(await screen.findByRole('button', { name: 'Remove from my interests' }))

    // THEN only my rating is deleted, not the shared item
    await waitFor(() => expect(sentWrites(fetchMock)).toEqual([['DELETE', '/ratings/900', null]]))
  })

  test('shows the API error message when saving fails', async () => {
    // GIVEN the API rejects the item update
    fetchMock.mockImplementation(async (url, init) => (init?.method === 'PUT'
      ? jsonResponse({ message: 'Unknown attribute ids: 9' }, 422)
      : respond(url, init)))
    renderFormAt('/interests/100/edit')
    await screen.findByDisplayValue('412')

    // WHEN the form is saved
    fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

    // THEN the API message is shown
    expect(await screen.findByText('Unknown attribute ids: 9')).toBeInTheDocument()
  })
})
