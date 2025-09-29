import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '@/constants'
import { AuthService } from './auth.service'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  refreshed?: boolean
}

export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
    
    if (!token) {
      window.location.href = "/login"
      return { error: 'No token found' }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(refreshToken && { 'X-Refresh-Token': refreshToken }),
      ...options.headers
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      })

      // Check if token was refreshed (backend sends lowercase headers)
      const newAccessToken = response.headers.get('x-new-access-token')
      const tokenRefreshed = response.headers.get('x-token-refreshed') === 'true'
      const iiflSessionsRefreshed = response.headers.get('x-iifl-sessions-refreshed') === 'true'

      if (newAccessToken) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newAccessToken)
        console.log('✅ Token refreshed automatically')
      }

      if (iiflSessionsRefreshed) {
        console.log('✅ IIFL sessions refreshed automatically')
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token if we have a refresh token
          if (refreshToken) {
            try {
              await AuthService.refreshToken()
              // Retry the request with new token
              return this.makeRequest<T>(endpoint, options)
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError)
              localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
              localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
              window.location.href = "/login"
              return { error: 'Authentication failed' }
            }
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
            window.location.href = "/login"
            return { error: 'Authentication failed' }
          }
        }
        
        const errorData = await response.json().catch(() => ({}))
        return { error: errorData.detail || `API call failed: ${response.statusText}` }
      }

      const data = await response.json()
      return { 
        data, 
        refreshed: tokenRefreshed || iiflSessionsRefreshed 
      }
    } catch (error) {
      console.error('API call failed:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  static async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  static async put<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  static async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
