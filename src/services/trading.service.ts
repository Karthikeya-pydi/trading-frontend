import { API_BASE_URL, API_ENDPOINTS, LOCAL_STORAGE_KEYS } from '@/constants'
import { 
  Position, 
  Trade, 
  Order, 
  PortfolioSummary, 
  PnLData, 
  OrderForm, 
  ApiKeys, 
  MarketData,
  Holding,
  HoldingsSummary,
  DailyPnL,
  RiskMetrics,
  UpdatePricesResponse,
  SquareOffResponse,
  BalanceResponse
} from '@/types'

export class TradingService {
  private static getAuthHeaders() {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }

  private static async apiCall<T>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    
    if (!token) {
      window.location.href = "/login"
      return {} as T
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, redirect to login
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
        window.location.href = "/login"
        return {} as T
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  // API Keys Management
  static async saveApiKeys(keys: ApiKeys): Promise<any> {
    return this.apiCall(API_ENDPOINTS.SET_IIFL_CREDENTIALS, 'POST', keys)
  }

  // Portfolio Management
  static async getPortfolioSummary(): Promise<PortfolioSummary> {
    try {
      console.log('🔍 TradingService - Fetching portfolio summary')
      const response = await this.apiCall<PortfolioSummary>('/api/portfolio/summary')
      console.log('✅ TradingService - Portfolio summary response:', response)
      return response
    } catch (error) {
      console.error('❌ TradingService - Error fetching portfolio summary:', error)
      throw error
    }
  }

  static async getPnLData(): Promise<PnLData> {
    try {
      console.log('🔍 TradingService - Fetching PnL data')
      const response = await this.apiCall<PnLData>('/api/portfolio/pnl')
      console.log('✅ TradingService - PnL data response:', response)
      return response
    } catch (error) {
      console.error('❌ TradingService - Error fetching PnL data:', error)
      throw error
    }
  }

  static async getHoldings(): Promise<Holding[]> {
    try {
      console.log('🔍 TradingService - Fetching holdings from: /api/portfolio/holdings')
      const response = await this.apiCall<any>('/api/portfolio/holdings')
      console.log('✅ TradingService - Raw holdings response:', response)
      
      // Log the complete structure for debugging
      console.log('🔍 TradingService - Full response structure:', JSON.stringify(response, null, 2))
      
      // Handle the new backend response structure
      if (response?.holdings?.result?.RMSHoldingList?.Holdings) {
        console.log('✅ TradingService - Found IIFL RMS holdings structure')
        const holdings = Object.entries(response.holdings.result.RMSHoldingList.Holdings).map(([isin, holdingData]: [string, any]) => ({
          ISIN: isin,
          HoldingQuantity: holdingData.HoldingQuantity,
          BuyAvgPrice: holdingData.BuyAvgPrice,
          ExchangeNSEInstrumentId: holdingData.ExchangeNSEInstrumentId,
          CreatedOn: holdingData.CreatedOn,
          IsCollateralHolding: holdingData.IsCollateralHolding,
          // Frontend processed fields
          instrument: isin,
          quantity: holdingData.HoldingQuantity || 0,
          average_price: holdingData.BuyAvgPrice || 0,
          current_price: holdingData.BuyAvgPrice || 0, // Will be updated with live prices
          market_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          invested_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          unrealized_pnl: 0, // Will be calculated with live prices
          unrealized_pnl_percent: 0
        })) as Holding[]
        console.log('✅ TradingService - Processed RMS holdings:', holdings)
        return holdings
      }
      
      // Handle CollateralHoldings if present
      if (response?.holdings?.result?.CollateralHoldings) {
        console.log('✅ TradingService - Found IIFL Collateral holdings structure')
        console.log('🔍 TradingService - CollateralHoldings content:', response.holdings.result.CollateralHoldings)
        console.log('🔍 TradingService - CollateralHoldings keys:', Object.keys(response.holdings.result.CollateralHoldings))
        
        // Check if CollateralHoldings is empty
        if (Object.keys(response.holdings.result.CollateralHoldings).length === 0) {
          console.log('⚠️ TradingService - CollateralHoldings is empty, checking for other holding types')
          
          // Check if there are other holding types in the result
          console.log('🔍 TradingService - All result keys:', Object.keys(response.holdings.result))
          
          // Try to find any holdings in the result
          for (const [key, value] of Object.entries(response.holdings.result)) {
            console.log(`🔍 TradingService - Checking key: ${key}`, value)
            if (key.includes('Holding') && value && typeof value === 'object') {
              console.log(`✅ TradingService - Found potential holdings in ${key}:`, value)
            }
          }
          
          return []
        }
        
        const holdings = Object.entries(response.holdings.result.CollateralHoldings).map(([isin, holdingData]: [string, any]) => ({
          ISIN: isin,
          HoldingQuantity: holdingData.HoldingQuantity,
          BuyAvgPrice: holdingData.BuyAvgPrice,
          ExchangeNSEInstrumentId: holdingData.ExchangeNSEInstrumentId,
          CreatedOn: holdingData.CreatedOn,
          IsCollateralHolding: true,
          // Frontend processed fields
          instrument: isin,
          quantity: holdingData.HoldingQuantity || 0,
          average_price: holdingData.BuyAvgPrice || 0,
          current_price: holdingData.BuyAvgPrice || 0,
          market_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          invested_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          unrealized_pnl: 0,
          unrealized_pnl_percent: 0
        })) as Holding[]
        console.log('✅ TradingService - Processed Collateral holdings:', holdings)
        return holdings
      }
      
      // If response is directly an array, return it
      if (Array.isArray(response)) {
        console.log('✅ TradingService - Response is direct array:', response)
        return response
      }
      
      // If response has a different structure, try to extract
      if (response?.holdings && Array.isArray(response.holdings)) {
        console.log('✅ TradingService - Found holdings array in response:', response.holdings)
        return response.holdings
      }
      
      console.log('❌ TradingService - No holdings found in response structure')
      console.log('🔍 TradingService - Response keys:', Object.keys(response || {}))
      if (response?.holdings) {
        console.log('🔍 TradingService - Holdings keys:', Object.keys(response.holdings))
      }
      
      return []
    } catch (error) {
      console.error('❌ TradingService - Error fetching holdings:', error)
      return []
    }
  }

  static async getHoldingsSummary(): Promise<HoldingsSummary> {
    try {
      console.log('🔍 TradingService - Fetching holdings summary')
      const response = await this.apiCall<{status: string, summary: HoldingsSummary, message: string}>('/api/portfolio/holdings-summary')
      console.log('✅ TradingService - Holdings summary response:', response)
      
      // Return the summary object from the response
      return response?.summary || response
    } catch (error) {
      console.error('❌ TradingService - Error fetching holdings summary:', error)
      throw error
    }
  }

  static async getDailyPnL(): Promise<DailyPnL> {
    try {
      console.log('🔍 TradingService - Fetching daily PnL')
      const response = await this.apiCall<DailyPnL>('/api/portfolio/daily-pnl')
      console.log('✅ TradingService - Daily PnL response:', response)
      return response
    } catch (error) {
      console.error('❌ TradingService - Error fetching daily PnL:', error)
      throw error
    }
  }

  static async getRiskMetrics(): Promise<RiskMetrics | null> {
    try {
      console.log('🔍 TradingService - Fetching risk metrics')
      const response = await this.apiCall<any>('/api/portfolio/risk-metrics')
      console.log('✅ TradingService - Risk metrics response:', response)
      
      if (response?.message?.includes('No positions')) {
        return null
      }
      return response
    } catch (error) {
      console.error('❌ TradingService - Error fetching risk metrics:', error)
      return null
    }
  }

  static async updatePortfolioPrices(): Promise<UpdatePricesResponse> {
    return this.apiCall<UpdatePricesResponse>('/api/portfolio/update-prices', 'POST')
  }

  // Positions
  static async getPositions(): Promise<Position[]> {
    return this.apiCall<Position[]>(API_ENDPOINTS.POSITIONS)
  }

  static async squareOffPosition(positionId: string): Promise<SquareOffResponse> {
    return this.apiCall<SquareOffResponse>(`${API_ENDPOINTS.SQUARE_OFF}/${positionId}/square-off`, 'POST')
  }

  // Orders
  static async getOrders(): Promise<Order[]> {
    return this.apiCall<Order[]>(API_ENDPOINTS.ORDER_BOOK)
  }

  static async placeOrder(orderData: OrderForm): Promise<any> {
    return this.apiCall(API_ENDPOINTS.PLACE_ORDER, 'POST', orderData)
  }

  static async cancelOrder(orderId: string): Promise<any> {
    return this.apiCall(`${API_ENDPOINTS.CANCEL_ORDER}/${orderId}`, 'DELETE')
  }

  // Trades
  static async getTrades(): Promise<Trade[]> {
    return this.apiCall<Trade[]>(API_ENDPOINTS.TRADES)
  }

  // Market Data
  static async getMarketData(symbols: string[]): Promise<MarketData[]> {
    return this.apiCall<MarketData[]>(`${API_ENDPOINTS.MARKET_GET_QUOTES}?symbols=${symbols.join(',')}`)
  }

  static async getLTP(symbol: string): Promise<{ symbol: string; ltp: number }> {
    return this.apiCall<{ symbol: string; ltp: number }>(`${API_ENDPOINTS.MARKET_GET_LTP}?symbol=${symbol}`)
  }

  // Balance
  static async getBalance(): Promise<BalanceResponse> {
    return this.apiCall<BalanceResponse>(API_ENDPOINTS.IIFL_BALANCE)
  }
} 