import React from 'react'
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InterestFormPage from '@/components/interests/InterestFormPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import {
  booksCategory, duneItem, duneRating, duneRerating, moviesCategory, otherUserDuneRating,
} from '@/components/tests/common/Interests'

/** Longer than the form waits after typing before looking for similar names, in milliseconds. */
const LOOKUP_WAIT_MS = 400

/** API base URL the UI calls. */
const API_URL = 'http://localhost:3000/api'

/** Responses of the mocked endpoints, keyed by method and path. */
const responses: Record<string, object> = {
  'GET /categories': [booksCategory, moviesCategory],
  'GET /items/100': duneItem,
  'GET /ratings/item/100': [duneRating, otherUserDuneRating, duneRerating],
  'POST /items': { ...duneItem, id: 101 },
  'PUT /items/100': duneItem,
  'GET /items/similar?categoryId=10&name=dune': [duneItem],
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

  test('points to existing interests with a similar name instead of adding a duplicate', async () => {
    // GIVEN the new-interest form with Books chosen, where Dune already exists
    renderFormAt('/interests/new')
    await screen.findByRole('option', { name: 'Books' })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '10' } })

    // WHEN "dune" is typed as the name
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'dune' } })

    // THEN Dune is suggested with a link to rate it instead
    const warning = await screen.findByRole('status', { name: 'Similar interests' })
    expect(within(warning).getByRole('link', { name: 'Dune' })).toHaveAttribute('href', '/interests/100/edit')
    expect(warning).toHaveTextContent('Dune (Books)')
  })

  test('does not look for duplicates while editing an interest', async () => {
    // GIVEN the edit form for Dune, filled from the API
    renderFormAt('/interests/100/edit')
    await screen.findByDisplayValue('412')

    // WHEN the name is changed and the lookup delay passes
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'dune' } })
    await new Promise((resolve) => { setTimeout(resolve, LOOKUP_WAIT_MS) })

    // THEN no similar-name lookup is sent
    expect(fetchMock.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('/similar'))).toEqual([])
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

  test('edits an interest and rates it again', async () => {
    // GIVEN the edit form for Dune, filled from the API, with an empty rating field
    renderFormAt('/interests/100/edit')
    expect(await screen.findByDisplayValue('412')).toBeInTheDocument()
    expect(screen.getByLabelText('Rate it again (0 to 10)')).toHaveValue(null)

    // WHEN the page count changes, a new rating is given and the form is saved
    fireEvent.change(screen.getByLabelText('Pages'), { target: { value: '420' } })
    fireEvent.change(screen.getByLabelText('Rate it again (0 to 10)'), { target: { value: '9' } })
    fireEvent.change(screen.getByLabelText('My notes'), { target: { value: 'Third read' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

    // THEN the item is updated and the new rating is added next to my earlier ones
    expect(await screen.findByText('My rankings page')).toBeInTheDocument()
    expect(sentWrites(fetchMock)).toEqual([
      ['PUT', '/items/100', {
        name: 'Dune',
        description: 'Desert planet epic',
        imageUrl: 'https://example.com/dune.png',
        categoryId: 10,
        attributeValues: [{ attributeId: 2, value: '420' }],
      }],
      ['POST', '/ratings', { item_id: 100, rating: 9, notes: 'Third read' }],
    ])
  })

  test('saves an interest I already rated without adding a rating', async () => {
    // GIVEN the edit form for Dune, which I already rated
    renderFormAt('/interests/100/edit')
    await screen.findByDisplayValue('412')

    // WHEN it is saved with the rating field left empty
    fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

    // THEN only the item is updated
    expect(await screen.findByText('My rankings page')).toBeInTheDocument()
    expect(sentWrites(fetchMock).map(([method, path]) => [method, path])).toEqual([['PUT', '/items/100']])
  })

  test('shows my grade, everyone\'s grade and my ratings newest first', async () => {
    // GIVEN I rated Dune 9.5 and then 8.5, and another user rated it 6
    // WHEN the edit form for Dune loads
    renderFormAt('/interests/100/edit')

    // THEN my grade averages my two ratings and everyone's grade averages each user's grade
    const history = await screen.findByRole('table', { name: 'My ratings' })
    expect(screen.getByText('My grade').nextSibling).toHaveTextContent('9.0')
    expect(screen.getByText('from 2 of my ratings')).toBeInTheDocument()
    expect(screen.getByText('Everyone\'s grade').nextSibling).toHaveTextContent('7.5')
    expect(screen.getByText('from 3 ratings')).toBeInTheDocument()
    const rows = within(history).getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell').slice(1, 3).map((cell) => cell.textContent))).toEqual([
      ['8.5', 'Slower the second time'],
      ['9.5', 'Reread every year'],
    ])
  })

  test('removes one of my ratings and updates the grades', async () => {
    // GIVEN the edit form for Dune and a confirmed removal
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    renderFormAt('/interests/100/edit')
    const history = await screen.findByRole('table', { name: 'My ratings' })

    // WHEN my newest rating is removed
    fireEvent.click(within(history).getAllByRole('button', { name: 'Remove' })[0])

    // THEN only that rating is deleted and my grade falls back to my remaining rating
    await waitFor(() => expect(screen.getByText('My grade').nextSibling).toHaveTextContent('9.5'))
    expect(sentWrites(fetchMock)).toEqual([['DELETE', '/ratings/903', null]])
    expect(screen.getByText('Everyone\'s grade').nextSibling).toHaveTextContent('7.8')
  })

  test('removes the interest from my list by deleting all my ratings', async () => {
    // GIVEN the edit form for Dune and a confirmed removal
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    renderFormAt('/interests/100/edit')

    // WHEN it is removed
    fireEvent.click(await screen.findByRole('button', { name: 'Remove from my interests' }))

    // THEN both of my ratings are deleted, not the shared item
    expect(await screen.findByText('My rankings page')).toBeInTheDocument()
    expect(sentWrites(fetchMock)).toEqual([['DELETE', '/ratings/900', null], ['DELETE', '/ratings/903', null]])
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
