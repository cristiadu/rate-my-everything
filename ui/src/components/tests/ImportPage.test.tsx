import React from 'react'
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ImportPage from '@/components/interests/ImportPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { booksCategory, duneItem, moviesCategory } from '@/components/tests/common/Interests'
import { lastFmImportedItems } from '@/components/tests/common/Imports'

/** API base URL the UI calls. */
const API_URL = 'http://localhost:3000/api'

/** Responses of the mocked endpoints, keyed by method and path. */
const responses: Record<string, object> = {
  'GET /categories': [booksCategory, moviesCategory],
  'GET /imports/lastfm?query=rj': lastFmImportedItems,
  'POST /items': { ...duneItem, id: 300, name: 'In Rainbows' },
}

/** Answers a mocked request from the responses table, or with a 404 error. */
const respond = async (url: RequestInfo | URL, init?: RequestInit) => {
  const body = responses[`${init?.method} ${String(url).replace(API_URL, '')}`]
  return body ? jsonResponse(body) : jsonResponse({ message: 'Unknown Last.fm user id: nobody' }, 404)
}

/** Lists the item bodies the page posted. */
const postedItems = (fetchMock: jest.MockedFunction<typeof fetch>) => fetchMock.mock.calls
  .filter(([, init]) => init?.method === 'POST')
  .map(([, init]) => JSON.parse(String(init?.body)))

/** Renders the import page inside the auth provider and a router. */
const renderImportPage = () => render(
  <AuthProvider>
    <MemoryRouter>
      <ImportPage />
    </MemoryRouter>
  </AuthProvider>,
)

/** Searches the given Last.fm username from the rendered page. */
const searchLastFm = (username: string) => {
  fireEvent.change(screen.getByLabelText('Last.fm username'), { target: { value: username } })
  fireEvent.click(screen.getByRole('button', { name: 'Find' }))
}

describe('ImportPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
    fetchMock.mockImplementation(respond)
  })

  test('lists the interests found on Last.fm, all selected', async () => {
    // GIVEN the import page
    renderImportPage()

    // WHEN a Last.fm username is searched
    searchLastFm('rj')

    // THEN artists and albums are listed with their type and selected
    expect(await screen.findByText('Artist')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Radiohead')).toBeChecked()
    expect(await screen.findByText('In Rainbows')).toBeInTheDocument()
    expect(screen.getByText('Album by Unknown Band, played 4 times on Last.fm')).toBeInTheDocument()
    expect(screen.getByLabelText('Select In Rainbows')).toBeChecked()
    expect(screen.getByLabelText('Select Demo Tape')).toBeChecked()
    expect(screen.getByRole('button', { name: 'Import 3 selected' })).toBeEnabled()
  })

  test('asks for a video or playlist URL when YouTube is chosen', () => {
    // GIVEN the import page
    renderImportPage()

    // WHEN YouTube is chosen
    fireEvent.change(screen.getByLabelText('Import from'), { target: { value: 'youtube' } })

    // THEN the search box asks for a playlist
    expect(screen.getByLabelText('Video or playlist URL')).toBeInTheDocument()
  })

  test('imports the selected interests into the chosen category with links to rate them', async () => {
    // GIVEN the Last.fm artists and albums are listed and only In Rainbows stays selected
    renderImportPage()
    searchLastFm('rj')
    await screen.findByRole('option', { name: 'Books' })
    fireEvent.click(screen.getByLabelText('Select Radiohead'))
    fireEvent.click(screen.getByLabelText('Select Demo Tape'))

    // WHEN it is imported into Books
    fireEvent.change(screen.getByLabelText('Add to category'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Import 1 selected' }))

    // THEN one item is created in Books and a link to rate it is shown
    expect(await screen.findByText('Imported 1 interests. Rate them to add them to your interests:')).toBeInTheDocument()
    expect(postedItems(fetchMock)).toEqual([{
      name: 'In Rainbows',
      description: 'Album by Radiohead, played 312 times on Last.fm',
      imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/in-rainbows.png',
      categoryId: 10,
      attributeValues: [],
    }])
    expect(screen.getByRole('link', { name: 'Rate In Rainbows' })).toHaveAttribute('href', '/interests/300/edit')
  })

  test('shows the error when the Last.fm user does not exist', async () => {
    // GIVEN the import page
    renderImportPage()

    // WHEN an unknown username is searched
    searchLastFm('nobody')

    // THEN the API error is shown and nothing is listed
    expect(await screen.findByText('Unknown Last.fm user id: nobody')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('table')).not.toBeInTheDocument())
  })
  test('shows the error when the categories cannot be loaded', async () => {
    // GIVEN an API that rejects the categories
    fetchMock.mockImplementation(async (url, init) => (String(url).endsWith('/categories')
      ? jsonResponse({ message: 'Invalid token' }, 401)
      : respond(url, init)))

    // WHEN the import page opens
    renderImportPage()

    // THEN the API error is shown
    expect(await screen.findByText('Invalid token')).toBeInTheDocument()
  })

  test('shows the error and keeps the found interests when importing fails', async () => {
    // GIVEN the Last.fm interests are listed and the API rejects new items
    fetchMock.mockImplementation(async (url, init) => (init?.method === 'POST'
      ? jsonResponse({ message: 'Unknown category id: 10' }, 422)
      : respond(url, init)))
    renderImportPage()
    searchLastFm('rj')
    await screen.findByRole('option', { name: 'Books' })

    // WHEN they are imported into Books
    fireEvent.change(screen.getByLabelText('Add to category'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Import 3 selected' }))

    // THEN the API error is shown and the interests stay listed to try again
    expect(await screen.findByText('Unknown category id: 10')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Radiohead')).toBeChecked()
  })
})
