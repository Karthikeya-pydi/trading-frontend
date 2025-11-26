'use client'

import { useState, useCallback } from 'react'
import { MarketDataService } from '@/services/market-data.service'
import type { ReturnsRecord, BhavcopyRecord } from '@/types'

export function useMarketData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStockReturns = useCallback(async (symbol: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await MarketDataService.getStockReturns(symbol)
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get stock returns'
      setError(errorMessage)
      console.error('Error getting stock returns:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllReturns = useCallback(async (options?: {
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await MarketDataService.getAllReturnsData(options)
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get returns data'
      setError(errorMessage)
      console.error('Error getting returns data:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getTopPerformingStocks = useCallback(async (
    period: '1_week' | '1_month' | '3_months' | '6_months' | '9_months' | '1_year' | '3_years' | '5_years' = '1_year',
    limit: number = 50
  ) => {
    setLoading(true)
    setError(null)
    try {
      const response = await MarketDataService.getTopPerformingStocksFromAll(period, limit)
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get top performing stocks'
      setError(errorMessage)
      console.error('Error getting top performing stocks:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getStockReturns,
    getAllReturns,
    getTopPerformingStocks,
  }
}

