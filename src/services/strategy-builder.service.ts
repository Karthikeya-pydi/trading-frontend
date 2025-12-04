import { ApiClient } from './api-client.service'
import type {
  Underlying,
  ExpiryDate,
  OptionChain,
  Strategy,
  CreateStrategyRequest,
  CreateStraddleRequest,
  AddPositionRequest,
} from '@/types/strategy-builder'

const API_BASE = '/api/strategy-builder'

export class StrategyBuilderService {
  // Get underlying list
  static async getUnderlyingList(exchangeSegment: string = 'NSEFO'): Promise<Underlying[]> {
    const result = await ApiClient.get<any>(
      `${API_BASE}/underlying-list?exchange_segment=${exchangeSegment}`
    )
    if (result.error) {
      console.error('Error fetching underlying list:', result.error)
      throw new Error(result.error)
    }
    
    // Log the response to debug
    console.log('Underlying list response:', result.data)
    
    // Handle API response structure: { type: "success", result: { listUnderlying: [...] } }
    let data = result.data
    if (!data) {
      console.warn('No data in underlying list response')
      return []
    }
    
    // Extract from nested structure
    if (data.result && data.result.listUnderlying) {
      data = data.result.listUnderlying
    } else if (Array.isArray(data.listUnderlying)) {
      data = data.listUnderlying
    } else if (Array.isArray(data)) {
      // Already an array
    } else if (data.result && Array.isArray(data.result)) {
      data = data.result
    } else {
      console.warn('Unexpected underlying list structure:', data)
      return []
    }
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn('Underlying list is not an array:', data)
      return []
    }
    
    // Transform to match Underlying type: { symbol, name, exchange_segment } -> { underlying, exchange_segment }
    const transformed = data.map((item: any) => ({
      underlying: item.symbol || item.underlying || item.name,
      exchange_segment: item.exchange_segment || exchangeSegment,
    }))
    
    console.log(`Loaded ${transformed.length} underlying instruments`)
    return transformed
  }

  // Get expiry dates
  static async getExpiryDates(
    underlying: string,
    exchangeSegment: string = 'NSEFO',
    series: string = ''
  ): Promise<ExpiryDate[]> {
    const result = await ApiClient.post<any>(`${API_BASE}/expiry-dates`, {
      underlying,
      exchange_segment: exchangeSegment,
      series: series || underlying,
    })
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Handle API response structure: { type: "success", result: { listExpiryDate: [...] } }
    let data = result.data
    if (!data) {
      return []
    }
    
    // Extract from nested structure
    if (data.result && data.result.listExpiryDate) {
      data = data.result.listExpiryDate
    } else if (Array.isArray(data.listExpiryDate)) {
      data = data.listExpiryDate
    } else if (Array.isArray(data)) {
      // Already an array of strings
    } else {
      return []
    }
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      return []
    }
    
    // Transform strings to ExpiryDate objects: "Dec 26 2024" -> { expiry_date: "Dec 26 2024" }
    return data.map((date: string | ExpiryDate) => {
      if (typeof date === 'string') {
        return { expiry_date: date }
      }
      return date
    })
  }

  // Get option chain
  static async getOptionChain(
    underlying: string,
    expiryDate: string
  ): Promise<OptionChain> {
    const result = await ApiClient.post<OptionChain>(`${API_BASE}/option-chain`, {
      underlying,
      expiry_date: expiryDate,
    })
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('No option chain data received')
    }
    return result.data
  }

  // Create strategy
  static async createStrategy(request: CreateStrategyRequest): Promise<Strategy> {
    const result = await ApiClient.post<Strategy>(
      `${API_BASE}/strategies/create`,
      request
    )
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('Strategy creation failed')
    }
    return result.data
  }

  // Create straddle
  static async createStraddle(request: CreateStraddleRequest): Promise<Strategy> {
    const result = await ApiClient.post<Strategy>(
      `${API_BASE}/strategies/straddle`,
      request
    )
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('Straddle creation failed')
    }
    return result.data
  }

  // Create strangle
  static async createStrangle(
    underlying: string,
    expiryDate: string,
    ceStrike: number,
    peStrike: number,
    quantity: number
  ): Promise<Strategy> {
    const result = await ApiClient.post<Strategy>(
      `${API_BASE}/strategies/strangle`,
      {
        underlying,
        expiry_date: expiryDate,
        ce_strike: ceStrike,
        pe_strike: peStrike,
        quantity,
      }
    )
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('Strangle creation failed')
    }
    return result.data
  }

  // Get strategy
  static async getStrategy(strategyId: string): Promise<Strategy> {
    const result = await ApiClient.get<Strategy>(`${API_BASE}/strategies/${strategyId}`)
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('Strategy not found')
    }
    return result.data
  }

  // Get all strategies
  static async getAllStrategies(): Promise<Strategy[]> {
    const result = await ApiClient.get<any>(`${API_BASE}/strategies`)
    if (result.error) {
      throw new Error(result.error)
    }
    
    // Handle API response structure: { type: "success", strategies: [...] }
    let data = result.data
    if (!data) {
      return []
    }
    
    // Extract from nested structure
    if (data.strategies && Array.isArray(data.strategies)) {
      data = data.strategies
    } else if (Array.isArray(data)) {
      // Already an array
    } else {
      return []
    }
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      return []
    }
    
    return data
  }

  // Add position to strategy
  static async addPosition(
    strategyId: string,
    position: AddPositionRequest
  ): Promise<Strategy> {
    const result = await ApiClient.post<Strategy>(
      `${API_BASE}/strategies/${strategyId}/positions`,
      position
    )
    if (result.error) {
      throw new Error(result.error)
    }
    if (!result.data) {
      throw new Error('Failed to add position')
    }
    return result.data
  }

  // Remove position from strategy
  static async removePosition(
    strategyId: string,
    positionId: string
  ): Promise<void> {
    const result = await ApiClient.delete(
      `${API_BASE}/strategies/${strategyId}/positions/${positionId}`
    )
    if (result.error) {
      throw new Error(result.error)
    }
  }

  // Subscribe to strategy updates
  static async subscribeStrategy(strategyId: string): Promise<void> {
    const result = await ApiClient.post(
      `${API_BASE}/strategies/${strategyId}/subscribe`
    )
    if (result.error) {
      throw new Error(result.error)
    }
  }

  // Delete strategy
  static async deleteStrategy(strategyId: string): Promise<void> {
    const result = await ApiClient.delete(`${API_BASE}/strategies/${strategyId}`)
    if (result.error) {
      throw new Error(result.error)
    }
  }
}

