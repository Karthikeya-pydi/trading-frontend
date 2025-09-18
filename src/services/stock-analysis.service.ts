import { API_ENDPOINTS } from '@/constants'
import { ApiClient } from './api-client.service'
import { 
  StockAnalysisResponse, 
  AvailableStocksResponse, 
  StockAnalysisError 
} from '@/types'
import { generateMockStockAnalysis } from '@/lib/mock-data'

export class StockAnalysisService {
  /**
   * Search for stock analysis by symbol
   * @param symbol Stock symbol to analyze (e.g., "RELIANCE", "TCS", "HDFC")
   * @returns Promise<StockAnalysisResponse>
   */
  static async searchStockAnalysis(symbol: string): Promise<StockAnalysisResponse> {
    try {
      console.log('🔍 StockAnalysisService - Searching stock analysis for:', symbol)
      
      const result = await ApiClient.get<StockAnalysisResponse>(
        `${API_ENDPOINTS.STOCK_ANALYSIS_SEARCH}?symbol=${encodeURIComponent(symbol.toUpperCase())}`
      )

      if (result.error) {
        // Check if it's a network error (backend not available)
        if (result.error.includes('Failed to fetch') || result.error.includes('NetworkError')) {
          console.warn('⚠️ Backend not available, generating mock data for development')
          // Generate mock data for development/testing
          const mockData = generateMockStockAnalysis(symbol)
          console.log('✅ StockAnalysisService - Generated mock data:', mockData.symbol)
          return mockData
        }
        // Check if it's a 404 error (symbol not found)
        if (result.error.includes('404') || result.error.includes('No data found')) {
          throw new Error(`No data found for stock: ${symbol.toUpperCase()}`)
        }
        throw new Error(result.error)
      }

      console.log('✅ StockAnalysisService - Stock analysis response:', result.data)
      return result.data as StockAnalysisResponse
    } catch (error) {
      console.error('❌ StockAnalysisService - Error searching stock analysis:', error)
      throw error
    }
  }

  /**
   * Get list of available stocks for analysis
   * @returns Promise<AvailableStocksResponse>
   */
  static async getAvailableStocks(): Promise<AvailableStocksResponse> {
    try {
      console.log('🔍 StockAnalysisService - Fetching available stocks')
      
      const result = await ApiClient.get<AvailableStocksResponse>(
        API_ENDPOINTS.STOCK_ANALYSIS_STOCKS
      )

      if (result.error) {
        // Check if it's a network error (backend not available)
        if (result.error.includes('Failed to fetch') || result.error.includes('NetworkError')) {
          console.warn('⚠️ Backend not available, returning default stock list')
          // Return a default list of common Indian stocks for development
          return {
            stocks: [
              "RELIANCE", "TCS", "HDFC", "INFY", "HDFCBANK", "ICICIBANK", "KOTAKBANK",
              "BHARTIARTL", "ITC", "SBIN"
            ],
            count: 10
          }
        }
        throw new Error(result.error)
      }

      console.log('✅ StockAnalysisService - Available stocks response:', result.data)
      return result.data as AvailableStocksResponse
    } catch (error) {
      console.error('❌ StockAnalysisService - Error fetching available stocks:', error)
      // Return default stocks if backend is not available
      console.warn('⚠️ Returning default stock list due to error')
      return {
        stocks: [
          "RELIANCE", "TCS", "HDFC", "INFY", "HDFCBANK", "ICICIBANK", "KOTAKBANK",
          "BHARTIARTL", "ITC", "SBIN"
        ],
        count: 10
      }
    }
  }

  /**
   * Validate if a stock symbol is available for analysis
   * @param symbol Stock symbol to validate
   * @returns Promise<boolean>
   */
  static async validateStockSymbol(symbol: string): Promise<boolean> {
    try {
      const availableStocks = await this.getAvailableStocks()
      return availableStocks.stocks.includes(symbol.toUpperCase())
    } catch (error) {
      console.error('❌ StockAnalysisService - Error validating stock symbol:', error)
      return false
    }
  }
}
