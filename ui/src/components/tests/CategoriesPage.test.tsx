import React from 'react'
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react'
import CategoriesPage from '@/components/categories/CategoriesPage'
import { AuthProvider } from '@/components/users/AuthContext'
import { UserRole } from '@/api/generated/api'
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
    expect(screen.getByRole('cell', { name: 'Things to read' })).toBeInTheDocument()
    expect(screen.getByText('Author')).toBeInTheDocument()
  })

  test('lets non-admins suggest a new category for approval', async () => {
    // GIVEN a logged-in user without the admin role
    loginAs([UserRole.USER])
    renderPage()
    await screen.findByText('Books')

    // WHEN they fill in and send a new category
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send for approval' }))

    // THEN a change request is sent instead of creating the category
    expect(await screen.findByText('Your change was sent to the moderators for approval.')).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') ?? []
    expect(url).toBe('http://localhost:3000/api/change-requests')
    expect(JSON.parse(String(options?.body))).toEqual({
      targetType: 'category', action: 'create', changes: { name: 'Games', description: '', color: '#3E8ED0', attributeIds: [] },
    })
  })

  test('lets non-admins suggest removing a category by id', async () => {
    // GIVEN a user who confirms the removal prompt
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    loginAs([UserRole.USER])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement

    // WHEN suggesting the removal of Books
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Suggest removal' }))

    // THEN a deletion change request names Books by id and nothing is deleted
    expect(await screen.findByText('Your change was sent to the moderators for approval.')).toBeInTheDocument()
    const [, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') ?? []
    expect(JSON.parse(String(options?.body))).toEqual({ targetType: 'category', action: 'delete', targetId: 10 })
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
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
    expect(JSON.parse(String(options?.body))).toEqual({
      name: 'Books', description: 'Things to read', color: '#8C3060', attributeIds: [1, 2],
    })
  })

  test('creates a category in the color picked for it and shows the list in each category\'s color', async () => {
    // GIVEN an admin on the categories page, where Books has its berry color
    loginAs([UserRole.ADMIN, UserRole.USER])
    renderPage()
    expect(await screen.findByText('Books')).toHaveStyle({ backgroundColor: '#8C3060' })

    // WHEN a new Games category is created with a green color
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Games' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#48c78e' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

    // THEN the color is sent in capitals with the new category
    expect(await screen.findByText('Category Games created.')).toBeInTheDocument()
    const [, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') ?? []
    expect(JSON.parse(String(options?.body))).toEqual({ name: 'Games', description: '', color: '#48C78E', attributeIds: [] })
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
  test('lets non-admins suggest changes to an existing category by id', async () => {
    // GIVEN a logged-in user without the admin role
    loginAs([UserRole.USER])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement

    // WHEN they suggest a new description for Books
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Suggest edit' }))
    expect(screen.getByRole('heading', { name: 'Suggest changes to Books' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Novels and comics' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send for approval' }))

    // THEN an update change request names Books by id with the new description
    expect(await screen.findByText('Your change was sent to the moderators for approval.')).toBeInTheDocument()
    const [, options] = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST') ?? []
    expect(JSON.parse(String(options?.body))).toEqual({
      targetType: 'category',
      action: 'update',
      targetId: 10,
      changes: { name: 'Books', description: 'Novels and comics', color: '#8C3060', attributeIds: [1] },
    })
  })

  test.each([
    ['categories', '/categories'],
    ['attributes', '/attributes'],
  ])('shows the API error when the %s cannot be loaded', async (_list, failingPath) => {
    // GIVEN an admin and an API that rejects one of the two lists
    loginAs([UserRole.ADMIN])
    fetchMock.mockImplementation(async (url) => {
      if (String(url).endsWith(failingPath)) return jsonResponse({ message: 'Service unavailable' }, 503)
      return jsonResponse(String(url).endsWith('/attributes') ? testAttributes : testCategories)
    })

    // WHEN the page loads
    renderPage()

    // THEN the API's message is shown
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument()
  })

  test('keeps a category when the admin cancels the deletion', async () => {
    // GIVEN an admin who does not confirm the deletion prompt
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    loginAs([UserRole.ADMIN])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement

    // WHEN deleting Books
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Delete' }))

    // THEN nothing is deleted
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })

  test('clears the form when the category being edited is deleted', async () => {
    // GIVEN an admin editing Books who confirms the deletion prompt
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    loginAs([UserRole.ADMIN])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Books')

    // WHEN Books is deleted
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Delete' }))

    // THEN the deletion is confirmed and the form goes back to a new, empty category
    expect(await screen.findByText('Category Books deleted.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New category' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  test('shows the API error message when deleting fails', async () => {
    // GIVEN an admin who confirms the deletion and an API that rejects it
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    loginAs([UserRole.ADMIN])
    renderPage()
    const booksRow = (await screen.findByText('Books')).closest('tr') as HTMLElement
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Category is used by 3 items' }, 409))

    // WHEN deleting Books
    fireEvent.click(within(booksRow).getByRole('button', { name: 'Delete' }))

    // THEN the API's message is shown
    expect(await screen.findByText('Category is used by 3 items')).toBeInTheDocument()
  })
})
