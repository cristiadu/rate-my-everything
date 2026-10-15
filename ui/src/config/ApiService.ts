import ApiConfig from './ApiConfig'

interface ApiOptions {
  method?: string;
  /** Request body, already serialized as JSON. */
  body?: string | null;
  includeAuth?: boolean;
}

export default class ApiService {
  static async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body = null,
      includeAuth = true
    } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      method,
      headers,
      body,
    }

    const url = `${ApiConfig.API_URL}${endpoint}`

    const response = await fetch(url, config)

    if (response.status === 204) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type')
    let data

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && (data.message || data.error)
        ? data.message || data.error
        : 'An error occurred with the API request'

      throw new Error(errorMessage)
    }

    return data as T
  }
}

/**
 * Sends a request built by the generated API client through `ApiService.request`, so every call carries the user's token
 * and fails with the API's error message.
 */
export const apiFetch = <T,>(endpoint: string, init: RequestInit): Promise<T> => ApiService.request<T>(endpoint, {
  method: init.method,
  body: typeof init.body === 'string' ? init.body : null,
})
