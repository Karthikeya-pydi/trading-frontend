'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { PortfolioService } from '@/services/portfolio/portfolio.service'
import type {
  PortfolioSummary,
  PnLData,
  HoldingsSummary,
  DailyPnL,
  RiskMetrics,
  Holding,
} from '@/types'

interface PortfolioContextType {
  portfolioSummary: PortfolioSummary | null
  pnlData: PnLData | null
  holdings: Holding[] | null
  holdingsSummary: HoldingsSummary | null
  dailyPnL: DailyPnL | null
  riskMetrics: RiskMetrics | null
  loading: boolean
  error: string | null
  fetchPortfolioSummary: () => Promise<void>
  fetchPnLData: () => Promise<void>
  fetchHoldings: () => Promise<void>
  fetchHoldingsSummary: () => Promise<void>
  fetchDailyPnL: () => Promise<void>
  fetchRiskMetrics: () => Promise<void>
  refreshAll: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [pnlData, setPnLData] = useState<PnLData | null>(null)
  const [holdings, setHoldings] = useState<Holding[] | null>(null)
  const [holdingsSummary, setHoldingsSummary] = useState<HoldingsSummary | null>(null)
  const [dailyPnL, setDailyPnL] = useState<DailyPnL | null>(null)
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolioSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getPortfolioSummary()
      setPortfolioSummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio summary'
      setError(errorMessage)
      console.error('Error fetching portfolio summary:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPnLData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getPnLData()
      setPnLData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch P&L data'
      setError(errorMessage)
      console.error('Error fetching P&L data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHoldings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getHoldings()
      setHoldings(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch holdings'
      setError(errorMessage)
      setHoldings([])
      console.error('Error fetching holdings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHoldingsSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getHoldingsSummary()
      setHoldingsSummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch holdings summary'
      setError(errorMessage)
      console.error('Error fetching holdings summary:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDailyPnL = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getDailyPnL()
      setDailyPnL(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch daily P&L'
      setError(errorMessage)
      console.error('Error fetching daily P&L:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRiskMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PortfolioService.getRiskMetrics()
      setRiskMetrics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk metrics'
      setError(errorMessage)
      console.error('Error fetching risk metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchPortfolioSummary(),
      fetchPnLData(),
      fetchHoldings(),
      fetchHoldingsSummary(),
      fetchDailyPnL(),
      fetchRiskMetrics(),
    ])
  }, [
    fetchPortfolioSummary,
    fetchPnLData,
    fetchHoldings,
    fetchHoldingsSummary,
    fetchDailyPnL,
    fetchRiskMetrics,
  ])

  return (
    <PortfolioContext.Provider
      value={{
        portfolioSummary,
        pnlData,
        holdings,
        holdingsSummary,
        dailyPnL,
        riskMetrics,
        loading,
        error,
        fetchPortfolioSummary,
        fetchPnLData,
        fetchHoldings,
        fetchHoldingsSummary,
        fetchDailyPnL,
        fetchRiskMetrics,
        refreshAll,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}

