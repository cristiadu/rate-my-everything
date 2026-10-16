import React from 'react'
import { render, screen } from '@testing-library/react'
import SimilarRecordsWarning from '@/components/common/SimilarRecordsWarning'
import { getSimilarItems } from '@/api/generated/api'
import { jsonResponse, mockFetch } from '@/components/tests/common/Api'
import { duneItem } from '@/components/tests/common/Interests'

/** Longer than the warning waits after typing before looking for similar names, in milliseconds. */
const LOOKUP_WAIT_MS = 400

/** Renders the warning for items of category 1 similar to the given name. */
const renderWarning = (name: string, isEnabled = true) => render(
  <SimilarRecordsWarning
    findSimilar={getSimilarItems}
    name={name}
    isEnabled={isEnabled}
    filters={{ categoryId: 1 }}
    label="Similar interests"
    message="Similar interests already exist."
    renderRecord={(item) => <span>{item.name}</span>}
  />,
)

/** Waits until a lookup would have been sent. */
const waitForLookupDelay = () => new Promise((resolve) => { setTimeout(resolve, LOOKUP_WAIT_MS) })

describe('SimilarRecordsWarning', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = mockFetch()
    fetchMock.mockImplementation(async () => jsonResponse([duneItem]))
  })

  test('lists the similar records the endpoint returns for the trimmed name and filters', async () => {
    // GIVEN an endpoint that finds Dune
    // WHEN " dun " is typed
    renderWarning(' dun ')

    // THEN Dune is listed under the message, after asking for "dun" with the filters
    const warning = await screen.findByRole('status', { name: 'Similar interests' })
    expect(warning).toHaveTextContent('Similar interests already exist.Dune')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['http://localhost:3000/api/items/similar?categoryId=1&name=dun'])
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
    ['the warning is disabled', 'Dune', false],
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
