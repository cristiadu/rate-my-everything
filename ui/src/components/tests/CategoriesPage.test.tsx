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
      targetType: 'category', action: 'create', changes: { name: 'Games', description: '', attributeIds: [] },
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
})
