import React from 'react'
import { render, screen } from '@testing-library/react'
import SimilarRecordsWarning from '@/components/common/SimilarRecordsWarning'
import type { Category } from '@/components/types'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { testCategories } from '@/components/tests/common/Categories'

/** Longer than the warning waits after typing before looking for similar names, in milliseconds. */
const LOOKUP_WAIT_MS = 400

/** Renders the warning for categories similar to the given name. */
const renderWarning = (name: string, isEnabled = true) => render(
  <SimilarRecordsWarning<Category>
    endpoint="/categories/similar"
    name={name}
    isEnabled={isEnabled}
    filters={{ parentId: '1' }}
    label="Similar categories"
    message="Similar categories already exist."
    renderRecord={(category) => <span>{category.name}</span>}
  />,
)

/** Waits until a lookup would have been sent. */
const waitForLookupDelay = () => new Promise((resolve) => { setTimeout(resolve, LOOKUP_WAIT_MS) })

describe('SimilarRecordsWarning', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
    fetchMock.mockImplementation(async () => jsonResponse(testCategories))
  })

  test('lists the similar records the endpoint returns for the trimmed name and filters', async () => {
    // GIVEN an endpoint that finds Books
    // WHEN " book " is typed
    renderWarning(' book ')

    // THEN Books is listed under the message, after asking for "book" with the filters
    const warning = await screen.findByRole('status', { name: 'Similar categories' })
    expect(warning).toHaveTextContent('Similar categories already exist.Books')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/categories/similar?parentId=1&name=book'])
  })

  test('shows nothing when no record is similar', async () => {
    // GIVEN an endpoint that finds nothing
    fetchMock.mockImplementation(async () => jsonResponse([]))

    // WHEN a name is typed and the lookup delay passes
    renderWarning('Podcasts')
    await waitForLookupDelay()

    // THEN no warning is shown
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test.each([
    ['the name is shorter than 3 characters', 'bo', true],
    ['the warning is disabled', 'Books', false],
  ])('does not look up similar records when %s', async (_case, name, isEnabled) => {
    // GIVEN a name that should not be checked
    // WHEN it is typed and the lookup delay passes
    renderWarning(name, isEnabled)
    await waitForLookupDelay()

    // THEN the endpoint is not called and nothing is shown
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
