/** Builds a minimal JSON fetch Response with the given body and status. */
export const jsonResponse = <T>(body: T, status = 200) => ({
  ok: status < 400,
  status,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => body,
  text: async () => JSON.stringify(body),
}) as Response

/** Builds a 204 fetch Response, with no body. */
export const emptyResponse = () => ({
  ok: true,
  status: 204,
  headers: new Headers(),
  text: async () => '',
}) as Response

/** Replaces the global fetch with a fresh Jest mock and returns it. */
export const mockFetch = () => {
  const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn()
  globalThis.fetch = fetchMock
  return fetchMock
}
