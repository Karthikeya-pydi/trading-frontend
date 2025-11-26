'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { TradingService } from '@/services/trading.service'
import type { Position, Trade, Order } from '@/types'

interface TradingContextType {
  positions: Position[]
  trades: Trade[]
  orders: Order[]
  loading: boolean
  error: string | null
  fetchPositions: () => Promise<void>
  fetchTrades: () => Promise<void>
  fetchOrders: () => Promise<void>
  refreshAll: () => Promise<void>
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await TradingService.getPositions()
      setPositions(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions'
      setError(errorMessage)
      setPositions([])
      console.error('Error fetching positions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await TradingService.getTrades()
      setTrades(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades'
      setError(errorMessage)
      setTrades([])
      console.error('Error fetching trades:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await TradingService.getOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
      setOrders([])
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPositions(), fetchTrades(), fetchOrders()])
  }, [fetchPositions, fetchTrades, fetchOrders])

  return (
    <TradingContext.Provider
      value={{
        positions,
        trades,
        orders,
        loading,
        error,
        fetchPositions,
        fetchTrades,
        fetchOrders,
        refreshAll,
      }}
    >
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider')
  }
  return context
}

