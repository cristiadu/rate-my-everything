import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import ApiService from '@/config/ApiService'
import InterestFormPage from '@/components/interests/InterestFormPage'
import { UserRole } from '@/components/types'
import { renderAsUser } from '@/components/tests/common/auth'
import {
  booksCategory, duneItem, duneRating, moviesCategory,
} from '@/components/tests/common/interestFixtures'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

/** Responses of the mocked GET endpoints the form reads. */
const getResponses: Record<string, object> = {
  '/categories': [booksCategory, moviesCategory],
  '/items/100': duneItem,
  '/ratings/mine': [duneRating],
}

/** Renders the form routes at the given path, with a stand-in for the rankings page it returns to. */
const renderFormAt = (path: string) => renderAsUser(
  <Routes>
    <Route path="/interests/new" element={<InterestFormPage />} />
    <Route path="/interests/:itemId/edit" element={<InterestFormPage />} />
    <Route path="/rankings" element={<p>My rankings page</p>} />
  </Routes>,
  [UserRole.USER],
  path,
)

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
  mockedApi.get.mockImplementation(async (endpoint: string) => getResponses[endpoint] as never)
})

test('adds an interest with its category attributes and my rating', async () => {
  // GIVEN the new-interest form with Books chosen
  mockedApi.post.mockResolvedValueOnce({ ...duneItem, id: 101 } as never)
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
  expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/items', {
    name: 'Hyperion',
    description: 'Pilgrims and the Shrike',
    imageUrl: null,
    categoryId: 10,
    attributeValues: [{ attributeId: 1, value: '482' }, { attributeId: 2, value: 'true' }],
  })
  expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/ratings', { item_id: 101, rating: 8.5, notes: 'Great frame story' })
})

test('only shows the attributes of the chosen category', async () => {
  renderFormAt('/interests/new')
  await screen.findByRole('option', { name: 'Movies' })

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '20' } })

  expect(screen.getByLabelText('Category')).toHaveValue('20')
  expect(screen.queryByLabelText('Pages')).not.toBeInTheDocument()
  expect(screen.queryByText('Movies details')).not.toBeInTheDocument()
})

test('edits an interest and my existing rating of it', async () => {
  // GIVEN the edit form for Dune, filled from the API
  mockedApi.put.mockResolvedValue(duneItem as never)
  renderFormAt('/interests/100/edit')
  expect(await screen.findByDisplayValue('412')).toBeInTheDocument()
  expect(screen.getByLabelText('My rating (0 to 10)')).toHaveValue(9.5)

  // WHEN the page count and rating change and are saved
  fireEvent.change(screen.getByLabelText('Pages'), { target: { value: '420' } })
  fireEvent.change(screen.getByLabelText('My rating (0 to 10)'), { target: { value: '9' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

  // THEN the item and my rating are updated in place
  expect(await screen.findByText('My rankings page')).toBeInTheDocument()
  expect(mockedApi.put).toHaveBeenNthCalledWith(1, '/items/100', {
    name: 'Dune',
    description: 'Desert planet epic',
    imageUrl: 'https://example.com/dune.png',
    categoryId: 10,
    attributeValues: [{ attributeId: 1, value: '420' }],
  })
  expect(mockedApi.put).toHaveBeenNthCalledWith(2, '/ratings/900', { rating: 9, notes: 'Reread every year' })
  expect(mockedApi.post).not.toHaveBeenCalled()
})

test('removes the interest from my list by deleting my rating', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  renderFormAt('/interests/100/edit')

  fireEvent.click(await screen.findByRole('button', { name: 'Remove from my interests' }))

  await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/ratings/900'))
  expect(mockedApi.delete).not.toHaveBeenCalledWith('/items/100')
})

test('shows the API error message when saving fails', async () => {
  mockedApi.put.mockRejectedValue(new Error('Attributes 9 do not belong to category "Books"'))
  renderFormAt('/interests/100/edit')
  await screen.findByDisplayValue('412')

  fireEvent.click(screen.getByRole('button', { name: 'Save interest' }))

  expect(await screen.findByText('Attributes 9 do not belong to category "Books"')).toBeInTheDocument()
})
