import { API_BASE_URL, API_ENDPOINTS, LOCAL_STORAGE_KEYS } from '@/constants'
import { User } from '@/types'

interface TokenRefreshResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export class AuthService {
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Login failed')
    }

    return response.json()
  }

  static async validateToken(): Promise<User> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
    if (!token) throw new Error('No token found')
    
    const headers: Record<string, string> = { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json" 
    }
    
    // Include refresh token if available for automatic refresh
    if (refreshToken) {
      headers['X-Refresh-Token'] = refreshToken
    }
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
      headers
    })

    // Check for new access token in response headers
    const newAccessToken = response.headers.get('x-new-access-token')
    if (newAccessToken) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newAccessToken)
      console.log('✅ Token refreshed automatically during validation')
    }

    if (!response.ok) {
      throw new Error('Invalid token')
    }

    return response.json()
  }

  static async getUserProfile(): Promise<User | null> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
    if (!token) return null

    try {
      const headers: Record<string, string> = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
      
      // Include refresh token if available for automatic refresh
      if (refreshToken) {
        headers['X-Refresh-Token'] = refreshToken
      }
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
        method: "GET",
        headers
      })

      // Check for new access token in response headers
      const newAccessToken = response.headers.get('x-new-access-token')
      if (newAccessToken) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newAccessToken)
        console.log('✅ Token refreshed automatically during profile fetch')
      }

      if (response.ok) {
        return response.json()
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
        return null
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  static async refreshToken(): Promise<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      throw new Error('No refresh token found')
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Token refresh failed')
    }

    const tokenData = await response.json()
    
    // Update stored tokens
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, tokenData.access_token)
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
    
    return tokenData
  }

  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
      const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
      
      // Call backend logout endpoint to clear IIFL sessions
      if (token) {
        try {
          const headers: Record<string, string> = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
          }
          
          // Include refresh token if available
          if (refreshToken) {
            headers['X-Refresh-Token'] = refreshToken
          }
          
          await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGOUT}`, {
            method: "POST",
            headers
          })
        } catch (error) {
          // Non-critical error - silent fail
        }
      }
      
      // Clear local tokens
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  static getGoogleOAuthUrl(callbackUrl: string): string {
    return `${API_BASE_URL}${API_ENDPOINTS.GOOGLE_OAUTH}?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(callbackUrl)}`
  }

  static redirectToGoogleAuth(): void {
    const callbackUrl = `${window.location.origin}/auth/callback`
    const oauthUrl = this.getGoogleOAuthUrl(callbackUrl)
    window.location.href = oauthUrl
  }
} 