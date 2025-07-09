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
  SquareOffResponse
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
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
    return this.apiCall<PortfolioSummary>('/api/portfolio/summary')
  }

  static async getPnLData(): Promise<PnLData> {
    return this.apiCall<PnLData>('/api/portfolio/pnl')
  }

  static async getHoldings(): Promise<Holding[]> {
    const response = await this.apiCall<any>('/api/portfolio/holdings')
    
    // Extract holdings from IIFL response structure
    if (response?.holdings?.result?.CollateralHoldings) {
      return Object.values(response.holdings.result.CollateralHoldings) as Holding[]
    }
    
    return []
  }

  static async getHoldingsSummary(): Promise<HoldingsSummary> {
    const response = await this.apiCall<any>('/api/portfolio/holdings-summary')
    return response?.summary || response
  }

  static async getDailyPnL(): Promise<DailyPnL> {
    return this.apiCall<DailyPnL>('/api/portfolio/daily-pnl')
  }

  static async getRiskMetrics(): Promise<RiskMetrics | null> {
    const response = await this.apiCall<any>('/api/portfolio/risk-metrics')
    if (response?.message?.includes('No positions')) {
      return null
    }
    return response
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
} 