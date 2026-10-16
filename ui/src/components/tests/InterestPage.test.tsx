import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InterestPage from '@/components/interests/InterestPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { AttributeValueType, UserRole, type ItemResponse, type RatedItemResponse } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { myComment } from '@/components/tests/common/Comments'
import {
  duneFirstRating, duneItem, duneRating, duneRerating, otherUserDuneRating,
} from '@/components/tests/common/Interests'

const typedDuneItem: ItemResponse = {
  ...duneItem,
  attributes: [
    ...duneItem.attributes,
    { id: 501, attribute: { id: 3, name: 'Finished', valueType: AttributeValueType.BOOLEAN }, value: 'true' },
    { id: 502, attribute: { id: 4, name: 'Released', valueType: AttributeValueType.DATE }, value: '2026-10-01' },
    { id: 503, attribute: { id: 5, name: 'Author', valueType: AttributeValueType.STRING }, value: 'Frank Herbert' },
  ],
}

/** Answers the page's requests with the given item and ratings, one comment, and echoes rating changes back. */
const serve = (fetchMock: jest.MockedFunction<typeof fetch>, item: ItemResponse, ratings: RatedItemResponse[]) => {
  fetchMock.mockImplementation(async (url, init) => {
    const requestUrl = String(url)
    if (init?.method === 'PUT') {
      const id = Number(requestUrl.split('/').pop())
      return jsonResponse({ ...ratings.find((rating) => rating.id === id), ...JSON.parse(String(init.body)) })
    }
    if (init?.method === 'DELETE') return jsonResponse(null, 204)
    if (requestUrl.includes('/comments/')) return jsonResponse([myComment])
    if (requestUrl.includes('/ratings/')) return jsonResponse(ratings)
    return jsonResponse(item)
  })
}

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

/** The rows of the rating history, as [rating, notes] text. */
const historyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)
  .map((row) => within(row).getAllByRole('cell').slice(1, 3).map((cell) => cell.textContent))

/** The big grade box shown above the given label. */
const gradeBox = (label: string) => screen.getByText(label).previousSibling as HTMLElement

describe('InterestPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    loginAs([UserRole.USER])
    fetchMock = mockFetch()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('shows the interest details and its discussion', async () => {
    // GIVEN the API returns Dune, no ratings and one comment on it
    serve(fetchMock, typedDuneItem, [])

    // WHEN Dune's page opens
    renderPageAt('/interests/100')

    // THEN its name, category, photo, description, attribute values and discussion are shown
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Dune' })).toHaveAttribute('src', duneItem.imageUrl)
    expect(screen.getByText('Desert planet epic')).toBeInTheDocument()
    expect(screen.getByText('Pages:')).toBeInTheDocument()
    expect(screen.getByText('412')).toBeInTheDocument()
    expect(screen.getByText('Finished:')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Released:')).toBeInTheDocument()
    expect(document.querySelector('time[datetime="2026-10-01"]')).toBeInTheDocument()
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Discussion' })).toBeInTheDocument()
    expect(await screen.findByText('Best sci-fi ever written')).toBeInTheDocument()
  })

  test('shows a placeholder when the interest has no photo, and grey grades before anyone rates it', async () => {
    // GIVEN Dune without a photo and without ratings
    serve(fetchMock, { ...typedDuneItem, imageUrl: null }, [])

    // WHEN Dune's page opens
    renderPageAt('/interests/100')

    // THEN a placeholder stands in for the photo and both grades are shown as not rated
    expect(await screen.findByText('No photo')).toBeInTheDocument()
    expect(gradeBox('My grade')).toHaveTextContent('-')
    expect(gradeBox('My grade')).toHaveClass('is-light')
    expect(gradeBox('Everyone\'s grade')).toHaveTextContent('-')
    expect(screen.getByText('You have not rated it yet.')).toBeInTheDocument()
  })

  test('shows my grade and everyone\'s grade in big boxes colored by the grade, with a link to add a rating', async () => {
    // GIVEN I rated Dune 9.5 and 8.5 and another user rated it 6
    serve(fetchMock, typedDuneItem, [duneRating, duneRerating, otherUserDuneRating])

    // WHEN Dune's page opens
    renderPageAt('/interests/100')

    // THEN my 9.0 is green, everyone's 7.3 (my latest 8.5 and their 6) is green too, and the + button leads to the rating form
    await waitFor(() => expect(gradeBox('My grade')).toHaveTextContent('9.0'))
    expect(gradeBox('My grade')).toHaveClass('is-success')
    expect(gradeBox('Everyone\'s grade')).toHaveTextContent('7.3')
    expect(screen.getByRole('link', { name: 'Add a rating' })).toHaveAttribute('href', '/interests/100/edit')
  })

  test('switches the history between my ratings and everyone\'s', async () => {
    // GIVEN I rated Dune twice and another user rated it once
    serve(fetchMock, typedDuneItem, [duneRating, duneRerating, otherUserDuneRating])
    renderPageAt('/interests/100')
    await screen.findByRole('table', { name: 'My ratings' })

    // WHEN the history switches to everyone's ratings
    fireEvent.click(screen.getByRole('button', { name: 'All' }))

    // THEN the other user's rating is listed too, newest first, and mine are tagged without actions on theirs
    expect(screen.getByRole('table', { name: 'Everyone\'s ratings' })).toBeInTheDocument()
    expect(historyRows()).toEqual([
      ['8.5Mine', 'Slower the second time'],
      ['6.0', ''],
      ['9.5Mine', 'Reread every year'],
    ])
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
  })

  test('shows the newest ratings until the history is expanded', async () => {
    // GIVEN I rated Dune three times and another user rated it once, and the history lists everyone's ratings
    serve(fetchMock, typedDuneItem, [duneFirstRating, duneRating, duneRerating, otherUserDuneRating])
    renderPageAt('/interests/100')
    await screen.findByRole('table', { name: 'My ratings' })
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(historyRows()).toHaveLength(3)

    // WHEN the history is expanded
    fireEvent.click(screen.getByRole('button', { name: 'Show all 4 ratings' }))

    // THEN my earliest rating is listed too
    expect(historyRows()).toHaveLength(4)
    expect(screen.getByText('Hard to get into')).toBeInTheDocument()
  })

  test('edits one of my ratings in place and updates my grade', async () => {
    // GIVEN Dune's page with my 9.5 and 8.5 ratings
    serve(fetchMock, typedDuneItem, [duneRating, duneRerating])
    renderPageAt('/interests/100')
    await screen.findByRole('table', { name: 'My ratings' })

    // WHEN my newest rating is changed to 6.5 with new notes
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Rating' }), { target: { value: '6.5' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), { target: { value: 'Not as good as I remembered' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    // THEN the change is sent, the row shows it and my grade averages 9.5 and 6.5
    await waitFor(() => expect(gradeBox('My grade')).toHaveTextContent('8.0'))
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(String(put?.[0])).toContain('/ratings/903')
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ rating: 6.5, notes: 'Not as good as I remembered' })
    expect(historyRows()[0]).toEqual(['6.5', 'Not as good as I remembered'])
  })

  test('removes one of my ratings after confirming', async () => {
    // GIVEN Dune's page with my 9.5 and 8.5 ratings and a confirmed removal
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    serve(fetchMock, typedDuneItem, [duneRating, duneRerating])
    renderPageAt('/interests/100')
    await screen.findByRole('table', { name: 'My ratings' })

    // WHEN my newest rating is removed
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])

    // THEN only my 9.5 rating is left
    await waitFor(() => expect(historyRows()).toEqual([['9.5', 'Reread every year']]))
    expect(gradeBox('My grade')).toHaveTextContent('9.5')
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
