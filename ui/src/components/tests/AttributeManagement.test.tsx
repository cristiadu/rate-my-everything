import React from 'react'
import {
  fireEvent, render, screen, within,
} from '@testing-library/react'
import AttributeManagement from '@/components/admin/attributes/AttributeManagement'
import { AttributeValueType } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { testAttributes } from '@/components/tests/common/Categories'

describe('AttributeManagement', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
  })

  test('lists attributes with their value types', async () => {
    // GIVEN the API returns two attributes
    fetchMock.mockResolvedValueOnce(jsonResponse(testAttributes))

    // WHEN the screen loads
    render(<AttributeManagement />)

    // THEN both attributes are listed with their value type
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    expect(within(authorRow).getByText(AttributeValueType.STRING)).toBeInTheDocument()
    expect(screen.getByText('Pages')).toBeInTheDocument()
  })

  test('offers every AttributeValueType and creates an attribute with the chosen one', async () => {
    // GIVEN the list loads and the create call succeeds
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse({ id: 3, name: 'Released', valueType: AttributeValueType.DATE }, 201))
      .mockResolvedValueOnce(jsonResponse(testAttributes))
    render(<AttributeManagement />)

    // WHEN a new date attribute is filled in and submitted
    fireEvent.click(await screen.findByRole('button', { name: 'New attribute' }))
    const options = within(screen.getByLabelText('Value type')).getAllByRole('option').map((option) => option.textContent)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Released' } })
    fireEvent.change(screen.getByLabelText('Value type'), { target: { value: AttributeValueType.DATE } })
    fireEvent.click(screen.getByRole('button', { name: 'Create attribute' }))

    // THEN the options come from the enum and the attribute is posted
    expect(await screen.findByText('Attribute Released created.')).toBeInTheDocument()
    expect(options).toEqual(Object.values(AttributeValueType))
    const [url, requestOptions] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/attributes')
    expect(requestOptions?.method).toBe('POST')
    expect(JSON.parse(String(requestOptions?.body))).toEqual({ name: 'Released', valueType: AttributeValueType.DATE })
  })

  test('edits an attribute by id', async () => {
    // GIVEN the list loads and the update call succeeds
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse({ ...testAttributes[0], name: 'Writer' }))
      .mockResolvedValueOnce(jsonResponse(testAttributes))
    render(<AttributeManagement />)

    // WHEN Author is renamed and saved
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    fireEvent.click(within(authorRow).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Writer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    // THEN the update is sent for its id with its value type kept
    expect(await screen.findByText('Attribute Writer updated.')).toBeInTheDocument()
    const [url, requestOptions] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/attributes/1')
    expect(requestOptions?.method).toBe('PUT')
    expect(JSON.parse(String(requestOptions?.body))).toEqual({ name: 'Writer', valueType: AttributeValueType.STRING })
  })

  test('shows the API error message when saving fails', async () => {
    // GIVEN the API rejects the new attribute
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse({ message: 'valueType must be one of: string, number, boolean, date' }, 400))
    render(<AttributeManagement />)

    // WHEN an attribute is submitted
    fireEvent.click(await screen.findByRole('button', { name: 'New attribute' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Colour' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create attribute' }))

    // THEN the API's message is shown
    expect(await screen.findByText('valueType must be one of: string, number, boolean, date')).toBeInTheDocument()
  })
})
