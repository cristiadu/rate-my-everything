import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import ApiService from '@/config/ApiService'
import AttributesPage from '@/components/categories/AttributesPage'
import { renderAsUser } from '@/components/tests/common/auth'

jest.mock('@/config/ApiService')
const mockedApi = ApiService as jest.Mocked<typeof ApiService>

beforeEach(() => {
  jest.resetAllMocks()
  localStorage.clear()
  mockedApi.get.mockResolvedValue([{ id: 1, name: 'Author', valueType: 'string' }] as never)
})

test('tells non-admins they cannot manage attributes', () => {
  renderAsUser(<AttributesPage />, ['user'])

  expect(screen.getByText('Only admins can manage attributes.')).toBeInTheDocument()
  expect(mockedApi.get).not.toHaveBeenCalled()
})

test('lets admins create an attribute', async () => {
  renderAsUser(<AttributesPage />, ['admin'])

  expect(await screen.findByText('Author')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pages' } })
  fireEvent.change(screen.getByLabelText('Value type'), { target: { value: 'number' } })
  fireEvent.click(screen.getByRole('button', { name: 'Create attribute' }))

  await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/attributes', { name: 'Pages', valueType: 'number' }))
})

test('lets admins edit an attribute', async () => {
  renderAsUser(<AttributesPage />, ['admin'])

  await screen.findByText('Author')
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Writer' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save attribute' }))

  await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/attributes/1', { name: 'Writer', valueType: 'string' }))
})
