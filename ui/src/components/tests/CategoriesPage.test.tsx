import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ApiService from '@/config/ApiService'
import CategoriesPage from '@/components/categories/CategoriesPage'
import { renderAsUser } from '@/components/tests/common/auth'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

const attributes = [
  { id: 1, name: 'Author', valueType: 'string' },
  { id: 2, name: 'Pages', valueType: 'number' },
]
const categories = [
  { id: 10, name: 'Books', description: 'Things to read', attributes: [attributes[0]] },
]

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
  mockedApi.get.mockImplementation(async (endpoint: string) => (endpoint === '/attributes' ? attributes : categories) as never)
})

test('lists categories with their attributes', async () => {
  renderAsUser(<CategoriesPage />, ['user'])

  expect(await screen.findByText('Books')).toBeInTheDocument()
  expect(screen.getByText('Things to read')).toBeInTheDocument()
  expect(screen.getByText('Author')).toBeInTheDocument()
})

test('does not offer attribute selection or load attributes for non-admins', async () => {
  renderAsUser(<CategoriesPage />, ['user'])

  await screen.findByText('Books')
  expect(mockedApi.get).not.toHaveBeenCalledWith('/attributes')
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

  await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/categories', { name: 'Games', description: '' }))
})

test('lets admins attach attributes when editing a category', async () => {
  renderAsUser(<CategoriesPage />, ['admin', 'user'])

  await screen.findByText('Books')
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

  const pages = await screen.findByRole('checkbox', { name: /Pages/ })
  expect(screen.getByRole('checkbox', { name: /Author/ })).toBeChecked()
  fireEvent.click(pages)
  fireEvent.click(screen.getByRole('button', { name: 'Save category' }))

  await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/categories/Books', {
    name: 'Books',
    description: 'Things to read',
    attributeIds: [1, 2],
  }))
})

test('deletes a category by name after confirmation', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  renderAsUser(<CategoriesPage />, ['user'])

  await screen.findByText('Books')
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/categories/Books'))
})

test('shows the API error message when saving fails', async () => {
  mockedApi.post.mockRejectedValue(new Error('Unknown attribute ids: 99'))
  renderAsUser(<CategoriesPage />, ['user'])

  await screen.findByText('Books')
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

  expect(await screen.findByText('Unknown attribute ids: 99')).toBeInTheDocument()
})
