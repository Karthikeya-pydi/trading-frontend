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

  // Stock Screening APIs
  searchStocks: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/search`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ query }),
    })
    return response.json()
  },

  scrapeStock: async (stockSymbol: string, stockName: string) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/scrape`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ stock_symbol: stockSymbol, stock_name: stockName }),
    })
    return response.json()
  },

  getStockData: async (stockSymbol: string) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/${stockSymbol}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },

  listStocks: async (skip = 0, limit = 100) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/?skip=${skip}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },

  refreshStockData: async (stockSymbol: string) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/${stockSymbol}/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },

  deleteStockData: async (stockSymbol: string) => {
    const response = await fetch(`${API_BASE_URL}/api/screening/${stockSymbol}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return response.json()
  },
}
