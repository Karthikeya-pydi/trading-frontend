import { API_BASE_URL } from '@/constants'
import { ApiClient } from './api-client.service'
import { 
  BhavcopyFilesListResponse,
  BhavcopyFileDataResponse,
  ReturnsFilesListResponse,
  ReturnsFileDataResponse
} from '@/types'

export class MarketDataService {
  private static async apiCall<T>(endpoint: string, method: string = 'GET', body?: object): Promise<T> {
    let result
    
    switch (method.toUpperCase()) {
      case 'GET':
        result = await ApiClient.get<T>(endpoint)
        break
      case 'POST':
        result = await ApiClient.post<T>(endpoint, body)
        break
      case 'PUT':
        result = await ApiClient.put<T>(endpoint, body)
        break
      case 'DELETE':
        result = await ApiClient.delete<T>(endpoint)
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }

    if (result.error) {
      throw new Error(result.error)
    }

    return result.data as T
  }

  // =============================================================================
  // BHAVCOPY ENDPOINTS
  // =============================================================================

  /**
   * Get list of all bhavcopy files
   */
  static async getBhavcopyFiles(): Promise<BhavcopyFilesListResponse> {
    try {
      console.log('📊 MarketDataService - Fetching bhavcopy files')
      const response = await this.apiCall<BhavcopyFilesListResponse>('/api/market/bhavcopy/files')
      console.log('✅ MarketDataService - Bhavcopy files response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching bhavcopy files:', error)
      throw error
    }
  }

  /**
   * Get data from a specific bhavcopy file
   */
  static async getBhavcopyFileData(filename: string): Promise<BhavcopyFileDataResponse> {
    try {
      console.log('📊 MarketDataService - Fetching bhavcopy file data:', filename)
      const response = await this.apiCall<BhavcopyFileDataResponse>(`/api/market/bhavcopy/file/${filename}`)
      console.log('✅ MarketDataService - Bhavcopy file data response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching bhavcopy file data:', error)
      throw error
    }
  }

  // =============================================================================
  // RETURNS ENDPOINTS
  // =============================================================================

  /**
   * Get list of all returns files
   */
  static async getReturnsFiles(): Promise<ReturnsFilesListResponse> {
    try {
      console.log('📈 MarketDataService - Fetching returns files')
      const response = await this.apiCall<ReturnsFilesListResponse>('/api/returns/files')
      console.log('✅ MarketDataService - Returns files response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching returns files:', error)
      throw error
    }
  }

  /**
   * Get data from a specific returns file with optional sorting and filtering
   */
  static async getReturnsFileData(
    filename: string, 
    options?: {
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      limit?: number
    }
  ): Promise<ReturnsFileDataResponse> {
    try {
      console.log('📈 MarketDataService - Fetching returns file data:', filename, options)
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (options?.sortBy) queryParams.append('sort_by', options.sortBy)
      if (options?.sortOrder) queryParams.append('sort_order', options.sortOrder)
      if (options?.limit) queryParams.append('limit', options.limit.toString())
      
      const queryString = queryParams.toString()
      const endpoint = `/api/returns/file/${filename}${queryString ? `?${queryString}` : ''}`
      
      const response = await this.apiCall<ReturnsFileDataResponse>(endpoint)
      console.log('✅ MarketDataService - Returns file data response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching returns file data:', error)
      throw error
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get the most recent bhavcopy file
   */
  static async getLatestBhavcopyFile(): Promise<string | null> {
    try {
      const filesResponse = await this.getBhavcopyFiles()
      if (filesResponse.files.length === 0) {
        return null
      }
      
      // Sort by last_modified date and get the most recent
      const sortedFiles = filesResponse.files.sort((a, b) => 
        new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()
      )
      
      return sortedFiles[0].filename
    } catch (error) {
      console.error('❌ MarketDataService - Error getting latest bhavcopy file:', error)
      throw error
    }
  }

  /**
   * Get the most recent returns file
   */
  static async getLatestReturnsFile(): Promise<string | null> {
    try {
      const filesResponse = await this.getReturnsFiles()
      if (filesResponse.files.length === 0) {
        return null
      }
      
      // Sort by last_modified date and get the most recent
      const sortedFiles = filesResponse.files.sort((a, b) => 
        new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()
      )
      
      return sortedFiles[0].filename
    } catch (error) {
      console.error('❌ MarketDataService - Error getting latest returns file:', error)
      throw error
    }
  }

  /**
   * Get top performing stocks by returns
   */
  static async getTopPerformingStocks(
    filename: string,
    period: '1_week' | '1_month' | '3_months' | '6_months' | '9_months' | '1_year' | '3_years' | '5_years' = '1_year',
    limit: number = 50
  ): Promise<ReturnsFileDataResponse> {
    try {
      console.log('🏆 MarketDataService - Fetching top performing stocks:', { filename, period, limit })
      
      const response = await this.getReturnsFileData(filename, {
        sortBy: `returns_${period}`,
        sortOrder: 'desc',
        limit
      })
      
      console.log('✅ MarketDataService - Top performing stocks response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching top performing stocks:', error)
      throw error
    }
  }

  /**
   * Get stocks with highest turnover
   */
  static async getHighTurnoverStocks(
    filename: string,
    limit: number = 50
  ): Promise<ReturnsFileDataResponse> {
    try {
      console.log('💰 MarketDataService - Fetching high turnover stocks:', { filename, limit })
      
      const response = await this.getReturnsFileData(filename, {
        sortBy: 'turnover',
        sortOrder: 'desc',
        limit
      })
      
      console.log('✅ MarketDataService - High turnover stocks response:', response)
      return response
    } catch (error) {
      console.error('❌ MarketDataService - Error fetching high turnover stocks:', error)
      throw error
    }
  }
}
