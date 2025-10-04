import ApiConfig from './ApiConfig'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
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

    // Add authorization header if token exists and includeAuth is true
    if (includeAuth) {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    }

    const url = `${ApiConfig.API_URL}${endpoint}`
    
    const response = await fetch(url, config)
      
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type')
    let data
      
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
      
    if (!response.ok) {
      // Format error message from response if available
      const errorMessage = typeof data === 'object' && data.error 
        ? data.error 
        : 'An error occurred with the API request'
          
      throw new Error(errorMessage)
    }
      
    return data as T
  }

  static get<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', includeAuth })
  }

  static post<T>(endpoint: string, body: Record<string, unknown>, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, includeAuth })
  }

  static put<T>(endpoint: string, body: Record<string, unknown>, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, includeAuth })
  }

  static delete<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', includeAuth })
  }
}
