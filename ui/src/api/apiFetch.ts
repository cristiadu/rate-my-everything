import ApiConfig from '@/config/ApiConfig'

/** Message thrown when a failed response carries no API error message. */
const DEFAULT_ERROR_MESSAGE = 'An error occurred with the API request'

/**
 * Sends a request built by the generated API client: adds the API base URL and the signed-in user's bearer token,
 * returns the parsed body, and throws the API error message when the response is not successful.
 */
export const apiFetch = async <T,>(endpoint: string, init: RequestInit): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('authToken')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${ApiConfig.API_URL}${endpoint}`, {
    method: init.method ?? 'GET',
    headers,
    body: typeof init.body === 'string' ? init.body : null,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type')
  const data = contentType?.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new Error(typeof data === 'object' && (data.message || data.error) ? data.message || data.error : DEFAULT_ERROR_MESSAGE)
  }

  return data as T
}
