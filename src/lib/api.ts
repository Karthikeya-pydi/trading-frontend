const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const api = {
  // Get Google OAuth URL with callback
  getGoogleOAuthUrl: (callbackUrl: string) => {
    return `${API_BASE_URL}/api/auth/oauth/google/login?redirect_uri=${encodeURIComponent(callbackUrl)}`
  },

  // Validate token (optional - for checking if user is authenticated)
  validateToken: async () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
    })
    return response.ok ? response.json() : null
  },

  // Save IIFL API keys
  saveApiKeys: async (keys: {
    apiKey: string
    secretKey: string
    clientId: string
    password: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys),
    })
    return response.json()
  },

  // Get portfolio data
  getPortfolio: async () => {
    const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },

  // Get positions
  getPositions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/positions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },
}
