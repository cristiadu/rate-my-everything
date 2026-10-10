import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import ApiService from '@/config/ApiService'
import AttributesPage from '@/components/categories/AttributesPage'
import { UserRole } from '@/components/types'
import { renderAsUser } from '@/components/tests/common/auth'
import { testAttributes } from '@/components/tests/common/categoryFixtures'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
  mockedApi.get.mockResolvedValue(testAttributes)
})

test('tells non-admins they cannot manage attributes', () => {
  // GIVEN a signed-in user without the admin role
  // WHEN the page loads
  renderAsUser(<AttributesPage />, [UserRole.USER])

  // THEN they see a notice and nothing is fetched
  expect(screen.getByText('Only admins can manage attributes.')).toBeInTheDocument()
  expect(mockedApi.get).not.toHaveBeenCalled()
})

test('lets admins create an attribute', async () => {
  // GIVEN an admin on the attributes page
  renderAsUser(<AttributesPage />, [UserRole.ADMIN])
  expect(await screen.findByText('Author')).toBeInTheDocument()

  // WHEN filling in a new number attribute and creating it
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pages' } })
  fireEvent.change(screen.getByLabelText('Value type'), { target: { value: 'number' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create attribute' }))

  // THEN it is posted to the API
  await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/attributes', { name: 'Pages', valueType: 'number' }))
})

test('lets admins edit an attribute', async () => {
  // GIVEN an admin editing Author
  renderAsUser(<AttributesPage />, [UserRole.ADMIN])
  await screen.findByText('Author')
  fireEvent.click(within(screen.getByRole('row', { name: /Author/ })).getByRole('button', { name: 'Edit' }))

  // WHEN renaming it and saving
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Writer' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save attribute' }))

  // THEN the update is sent for its id
  await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/attributes/1', { name: 'Writer', valueType: 'string' }))
})
