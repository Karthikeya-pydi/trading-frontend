import { API_BASE_URL, API_ENDPOINTS } from '@/constants'
import { ApiClient } from '@/services/api-client.service'

export const api = {
  // Get Google OAuth URL with callback
  getGoogleOAuthUrl: (callbackUrl: string) => {
    return `${API_BASE_URL}/api/auth/oauth/google/login?redirect_uri=${encodeURIComponent(callbackUrl)}`
  },

  // Validate token (optional - for checking if user is authenticated)
  validateToken: async () => {
    const result = await ApiClient.get(API_ENDPOINTS.AUTH_VALIDATE)
    return result.data || null
  },

  // Save IIFL API keys
  saveApiKeys: async (keys: {
    apiKey: string
    secretKey: string
    clientId: string
    password: string
  }) => {
    const result = await ApiClient.post('/api/keys', keys)
    return result.data
  },

  // Get portfolio data
  getPortfolio: async () => {
    const result = await ApiClient.get('/api/portfolio')
    return result.data
  },

  // Get positions
  getPositions: async () => {
    const result = await ApiClient.get('/api/positions')
    return result.data
  },

  // Stock Screening APIs
  searchStocks: async (query: string) => {
    const result = await ApiClient.post('/api/screening/search', { query })
    return result.data
  },

  scrapeStock: async (stockSymbol: string, stockName: string) => {
    const result = await ApiClient.post('/api/screening/scrape', { 
      stock_symbol: stockSymbol, 
      stock_name: stockName 
    })
    return result.data
  },

  getStockData: async (stockSymbol: string) => {
    const result = await ApiClient.get(`/api/screening/${stockSymbol}`)
    return result.data
  },

  listStocks: async (skip = 0, limit = 100) => {
    const result = await ApiClient.get(`/api/screening/?skip=${skip}&limit=${limit}`)
    return result.data
  },

  refreshStockData: async (stockSymbol: string) => {
    const result = await ApiClient.post(`/api/screening/${stockSymbol}/refresh`)
    return result.data
  },

  deleteStockData: async (stockSymbol: string) => {
    const result = await ApiClient.delete(`/api/screening/${stockSymbol}`)
    return result.data
  },

  // Stock Analysis APIs
  searchStockAnalysis: async (symbol: string) => {
    const result = await ApiClient.get(`/api/stock-analysis/search?symbol=${encodeURIComponent(symbol)}`)
    return result.data
  },

  getAvailableStocks: async () => {
    const result = await ApiClient.get('/api/stock-analysis/stocks')
    return result.data
  }
}