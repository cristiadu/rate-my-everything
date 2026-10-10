import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ApiService from '@/config/ApiService'
import CategoriesPage from '@/components/categories/CategoriesPage'
import { UserRole } from '@/components/types'
import { renderAsUser } from '@/components/tests/common/auth'
import { testAttributes, testCategories } from '@/components/tests/common/categoryFixtures'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
  mockedApi.get.mockImplementation(async (endpoint: string) => (endpoint === '/attributes' ? testAttributes : testCategories))
})

test('lists categories with their attributes', async () => {
  // GIVEN a signed-in user
  // WHEN the page loads
  renderAsUser(<CategoriesPage />, [UserRole.USER])

  // THEN each category shows its description and attributes
  expect(await screen.findByText('Books')).toBeInTheDocument()
  expect(screen.getByText('Things to read')).toBeInTheDocument()
  expect(screen.getByText('Author')).toBeInTheDocument()
})

test('lets non-admins browse without editing', async () => {
  // GIVEN a signed-in user without the admin role
  // WHEN the page loads
  renderAsUser(<CategoriesPage />, [UserRole.USER])
  await screen.findByText('Books')

  // THEN no attributes are fetched and no editing controls are shown
  expect(mockedApi.get).not.toHaveBeenCalledWith('/attributes')
  expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
})

test('lets admins attach attributes when editing a category', async () => {
  // GIVEN an admin editing Books, which is linked to Author
  renderAsUser(<CategoriesPage />, [UserRole.ADMIN, UserRole.USER])
  await screen.findByText('Books')
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  const pagesCheckbox = await screen.findByRole('checkbox', { name: /Pages/ })
  expect(screen.getByRole('checkbox', { name: /Author/ })).toBeChecked()

  // WHEN ticking Pages and saving
  fireEvent.click(pagesCheckbox)
  fireEvent.click(screen.getByRole('button', { name: 'Save category' }))

  // THEN both attribute ids are sent for Books
  await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/categories/Books', {
    name: 'Books',
    description: 'Things to read',
    attributeIds: [1, 2],
  }))
})

test('deletes a category by name after confirmation', async () => {
  // GIVEN an admin who confirms the deletion prompt
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  renderAsUser(<CategoriesPage />, [UserRole.ADMIN])
  await screen.findByText('Books')

  // WHEN deleting Books
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

  // THEN the category is deleted by name
  await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/categories/Books'))
})

test('shows the API error message when saving fails', async () => {
  // GIVEN an admin and an API that rejects the new category
  mockedApi.post.mockRejectedValue(new Error('Unknown attribute ids: 99'))
  renderAsUser(<CategoriesPage />, [UserRole.ADMIN])
  await screen.findByText('Books')

  // WHEN creating a category
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

  // THEN the API's message is shown
  expect(await screen.findByText('Unknown attribute ids: 99')).toBeInTheDocument()
})
