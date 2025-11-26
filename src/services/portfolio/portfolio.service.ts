import { API_ENDPOINTS } from '@/constants'
import { ApiClient } from '../api-client.service'
import type {
  PortfolioSummary,
  PnLData,
  HoldingsSummary,
  DailyPnL,
  RiskMetrics,
  UpdatePricesResponse,
  Holding,
} from '@/types'

export class PortfolioService {
  private static async apiCall<T>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
    const result = await ApiClient.makeRequest<T>(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (result.error) {
      throw new Error(result.error)
    }

    return result.data as T
  }

  static async getPortfolioSummary(): Promise<PortfolioSummary> {
    try {
      console.log('🔍 PortfolioService - Fetching portfolio summary')
      const response = await this.apiCall<PortfolioSummary>('/api/portfolio/summary')
      console.log('✅ PortfolioService - Portfolio summary response:', response)
      return response
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching portfolio summary:', error)
      throw error
    }
  }

  static async getPnLData(): Promise<PnLData> {
    try {
      console.log('🔍 PortfolioService - Fetching PnL data')
      const response = await this.apiCall<PnLData>('/api/portfolio/pnl')
      console.log('✅ PortfolioService - PnL data response:', response)
      return response
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching PnL data:', error)
      throw error
    }
  }

  static async getHoldings(): Promise<Holding[]> {
    try {
      console.log('🔍 PortfolioService - Fetching holdings from: /api/portfolio/holdings')
      const response = await this.apiCall<any>('/api/portfolio/holdings')
      console.log('✅ PortfolioService - Raw holdings response:', response)
      
      // Handle the new backend response structure
      if (response?.holdings?.result?.RMSHoldingList?.Holdings) {
        console.log('✅ PortfolioService - Found IIFL RMS holdings structure')
        const holdings = Object.entries(response.holdings.result.RMSHoldingList.Holdings).map(([isin, holdingData]: [string, any]) => ({
          ISIN: isin,
          HoldingQuantity: holdingData.HoldingQuantity,
          BuyAvgPrice: holdingData.BuyAvgPrice,
          ExchangeNSEInstrumentId: holdingData.ExchangeNSEInstrumentId,
          CreatedOn: holdingData.CreatedOn,
          IsCollateralHolding: holdingData.IsCollateralHolding,
          instrument: isin,
          quantity: holdingData.HoldingQuantity || 0,
          average_price: holdingData.BuyAvgPrice || 0,
          current_price: holdingData.BuyAvgPrice || 0,
          market_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          invested_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          unrealized_pnl: 0,
          unrealized_pnl_percent: 0
        })) as Holding[]
        return holdings
      }
      
      if (response?.holdings?.result?.CollateralHoldings) {
        console.log('✅ PortfolioService - Found IIFL Collateral holdings structure')
        if (Object.keys(response.holdings.result.CollateralHoldings).length === 0) {
          return []
        }
        
        const holdings = Object.entries(response.holdings.result.CollateralHoldings).map(([isin, holdingData]: [string, any]) => ({
          ISIN: isin,
          HoldingQuantity: holdingData.HoldingQuantity,
          BuyAvgPrice: holdingData.BuyAvgPrice,
          ExchangeNSEInstrumentId: holdingData.ExchangeNSEInstrumentId,
          CreatedOn: holdingData.CreatedOn,
          IsCollateralHolding: true,
          instrument: isin,
          quantity: holdingData.HoldingQuantity || 0,
          average_price: holdingData.BuyAvgPrice || 0,
          current_price: holdingData.BuyAvgPrice || 0,
          market_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          invested_value: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          unrealized_pnl: 0,
          unrealized_pnl_percent: 0
        })) as Holding[]
        return holdings
      }
      
      if (Array.isArray(response)) {
        return response
      }
      
      if (response?.holdings && Array.isArray(response.holdings)) {
        return response.holdings
      }
      
      return []
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching holdings:', error)
      return []
    }
  }

  static async getHoldingsSummary(): Promise<HoldingsSummary> {
    try {
      console.log('🔍 PortfolioService - Fetching holdings summary')
      const response = await this.apiCall<{status: string, summary: HoldingsSummary, message: string}>('/api/portfolio/holdings-summary')
      console.log('✅ PortfolioService - Holdings summary response:', response)
      return response?.summary || response
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching holdings summary:', error)
      throw error
    }
  }

  static async getDailyPnL(): Promise<DailyPnL> {
    try {
      console.log('🔍 PortfolioService - Fetching daily PnL')
      const response = await this.apiCall<DailyPnL>('/api/portfolio/daily-pnl')
      console.log('✅ PortfolioService - Daily PnL response:', response)
      return response
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching daily PnL:', error)
      throw error
    }
  }

  static async getRiskMetrics(): Promise<RiskMetrics | null> {
    try {
      console.log('🔍 PortfolioService - Fetching risk metrics')
      const response = await this.apiCall<any>('/api/portfolio/risk-metrics')
      console.log('✅ PortfolioService - Risk metrics response:', response)
      
      if (response?.message?.includes('No positions')) {
        return null
      }
      return response
    } catch (error) {
      console.error('❌ PortfolioService - Error fetching risk metrics:', error)
      return null
    }
  }

  static async updatePortfolioPrices(): Promise<UpdatePricesResponse> {
    return this.apiCall<UpdatePricesResponse>('/api/portfolio/update-prices', 'POST')
  }
}

