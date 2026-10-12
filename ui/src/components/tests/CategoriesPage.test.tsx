import React from 'react'
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react'
import CategoriesPage from '@/components/categories/CategoriesPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { loginAs } from '@/components/tests/common/Auth'
import { testAttributes, testCategories } from '@/components/tests/common/Categories'

/** Renders the categories page inside the auth provider. */
const renderPage = () => render(
  <AuthProvider>
    <CategoriesPage />
  </AuthProvider>,
)

describe('CategoriesPage', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    localStorage.clear()
    fetchMock = mockFetch()
    fetchMock.mockImplementation(async (url) => jsonResponse(String(url).endsWith('/attributes') ? testAttributes : testCategories))
  })

  test('lists categories with their attributes', async () => {
    // GIVEN a logged-in user
    loginAs([UserRole.USER])

    // WHEN the page loads
    renderPage()

    // THEN each category shows its description and attributes
    expect(await screen.findByText('Books')).toBeInTheDocument()
    expect(screen.getByText('Things to read')).toBeInTheDocument()
    expect(screen.getByText('Author')).toBeInTheDocument()
  })

  test('lets non-admins browse without editing', async () => {
    // GIVEN a logged-in user without the admin role
    loginAs([UserRole.USER])

    // WHEN the page loads
    renderPage()
    await screen.findByText('Books')

    // THEN no attributes are fetched and no editing controls are shown
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/categories'])
    expect(screen.queryByRole('form', { name: 'Create category' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  test('lets admins link attributes when editing a category', async () => {
    // GIVEN an admin editing Books, which is linked to Author
    loginAs([UserRole.ADMIN, UserRole.USER])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Edit' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Attributes' }))
    const pagesCheckbox = await screen.findByRole('checkbox', { name: /Pages/ })
    expect(screen.getByRole('checkbox', { name: /Author/ })).toBeChecked()

    // WHEN ticking Pages and saving
    fireEvent.click(pagesCheckbox)
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN both attribute ids are sent for Books
    expect(await screen.findByText('Category Books updated.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT') ?? []
    expect(url).toBe('http://localhost:3000/api/categories/Books')
    expect(JSON.parse(String(options?.body))).toEqual({ name: 'Books', description: 'Things to read', attributeIds: [1, 2] })
  })

  test('deletes a category by name after confirmation', async () => {
    // GIVEN an admin who confirms the deletion prompt
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    loginAs([UserRole.ADMIN])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement

    // WHEN deleting Books
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Delete' }))

    // THEN the category is deleted by name
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => (
      url === 'http://localhost:3000/api/categories/Books' && init?.method === 'DELETE'
    ))).toBe(true))
  })

  test('shows the API error message when saving fails', async () => {
    // GIVEN an admin and an API that rejects the new category
    loginAs([UserRole.ADMIN])
    renderPage()
    await screen.findByText('Books')
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Unknown attribute ids: 99' }, 422))

    // WHEN creating a category
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

    // THEN the API's message is shown
    expect(await screen.findByText('Unknown attribute ids: 99')).toBeInTheDocument()
  })

  test('offers to edit an existing category with a similar name instead of adding a duplicate', async () => {
    // GIVEN an admin on the new-category form, where Books already exists
    loginAs([UserRole.ADMIN])
    renderPage()
    await screen.findByText('Books')

    // WHEN "book" is typed as the name and the suggested Books is chosen
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'book' } })
    const warning = await screen.findByRole('status', { name: 'Similar categories' })
    fireEvent.click(within(warning).getByRole('button', { name: 'Edit Books' }))

    // THEN the lookup asked for names like "book" and Books is loaded for editing
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain('http://localhost:3000/api/categories/similar?name=book')
    expect(screen.getByRole('form', { name: 'Edit category' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Books')
  })
})
