import React from 'react'
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react'
import AttributeManagement from '@/components/admin/attributes/AttributeManagement'
import { AttributeValueType } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { formattedAttributes, testAttributes } from '@/components/tests/common/Categories'

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

  test('asks for a currency code only for currency attributes and sends it upper-cased', async () => {
    // GIVEN the list loads and the create call succeeds
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse(formattedAttributes.price, 201))
      .mockResolvedValueOnce(jsonResponse([...testAttributes, formattedAttributes.price]))
    render(<AttributeManagement />)
    fireEvent.click(await screen.findByRole('button', { name: 'New attribute' }))
    expect(screen.queryByLabelText('Currency code')).not.toBeInTheDocument()

    // WHEN a currency attribute is filled in with the code eur and submitted
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Price' } })
    fireEvent.change(screen.getByLabelText('Value type'), { target: { value: AttributeValueType.CURRENCY } })
    fireEvent.change(screen.getByLabelText('Currency code'), { target: { value: 'eur' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create attribute' }))

    // THEN the attribute is posted with EUR and listed with its currency
    expect(await screen.findByText('Attribute Price created.')).toBeInTheDocument()
    const [, requestOptions] = fetchMock.mock.calls[1]
    expect(JSON.parse(String(requestOptions?.body))).toEqual({ name: 'Price', valueType: AttributeValueType.CURRENCY, currencyCode: 'EUR' })
    expect(await screen.findByText('currency (EUR)')).toBeInTheDocument()
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
  test('shows the API error when the attributes cannot be loaded', async () => {
    // GIVEN the API rejects the token
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid token' }, 401))

    // WHEN the screen loads
    render(<AttributeManagement />)

    // THEN the message is shown and no attribute is listed
    expect(await screen.findByText('Invalid token')).toBeInTheDocument()
    expect(screen.getByText('No attributes yet.')).toBeInTheDocument()
  })

  test('closes the form when cancelled', async () => {
    // GIVEN Author is being edited
    fetchMock.mockResolvedValueOnce(jsonResponse(testAttributes))
    render(<AttributeManagement />)
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    fireEvent.click(within(authorRow).getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('heading', { name: 'Edit Author' })).toBeInTheDocument()

    // WHEN Cancel is clicked
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // THEN the form closes without saving
    expect(screen.queryByRole('heading', { name: 'Edit Author' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('deletes an attribute by id after confirmation and reloads the list', async () => {
    // GIVEN the admin confirms, the delete call succeeds and only Pages is left
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse(null, 204))
      .mockResolvedValueOnce(jsonResponse([testAttributes[1]]))
    render(<AttributeManagement />)

    // WHEN Author is deleted
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    fireEvent.click(within(authorRow).getByRole('button', { name: 'Delete' }))

    // THEN the delete is sent for its id and Author leaves the list
    expect(await screen.findByText('Attribute Author deleted.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'Author' })).not.toBeInTheDocument())
    const [url, requestOptions] = fetchMock.mock.calls[1]
    expect(url).toBe('http://localhost:3000/api/attributes/1')
    expect(requestOptions?.method).toBe('DELETE')
  })

  test('keeps an attribute when the admin cancels the deletion', async () => {
    // GIVEN the admin does not confirm
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    fetchMock.mockResolvedValueOnce(jsonResponse(testAttributes))
    render(<AttributeManagement />)

    // WHEN deleting Author
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    fireEvent.click(within(authorRow).getByRole('button', { name: 'Delete' }))

    // THEN nothing is sent and Author stays listed
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Author')).toBeInTheDocument()
  })

  test('shows the API error when deleting fails', async () => {
    // GIVEN the admin confirms and the delete call is rejected
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(testAttributes))
      .mockResolvedValueOnce(jsonResponse({ message: 'Attribute not found' }, 404))
    render(<AttributeManagement />)

    // WHEN Author is deleted
    const authorRow = (await screen.findByText('Author')).closest('tr') as HTMLElement
    fireEvent.click(within(authorRow).getByRole('button', { name: 'Delete' }))

    // THEN the API's message is shown and Author stays listed
    expect(await screen.findByText('Attribute not found')).toBeInTheDocument()
    expect(screen.getByText('Author')).toBeInTheDocument()
  })
})
