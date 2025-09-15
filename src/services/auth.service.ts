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
    if (!token) throw new Error('No token found')
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
    })

    if (!response.ok) {
      throw new Error('Invalid token')
    }

    return response.json()
  }

  static async getUserProfile(): Promise<User | null> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    if (!token) return null

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
      })

      if (response.ok) {
        return response.json()
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
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
      
      // Call backend logout endpoint to clear IIFL sessions
      if (token) {
        try {
          await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGOUT}`, {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json" 
            }
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