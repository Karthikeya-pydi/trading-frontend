"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  LogOut, 
  Settings, 
  RefreshCw, 
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  X,
  PieChart,
  Briefcase,
  Heart
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"
import { TradingService } from "@/services/trading.service"
import { PortfolioTab } from "@/components/dashboard/PortfolioTab"
import { PositionsTab } from "@/components/dashboard/PositionsTab"
import { Layout } from "@/components/layout/Layout"
import { usePortfolio } from "@/hooks/usePortfolio"
import { useTrading } from "@/hooks/useTrading"
import { useAuth } from "@/hooks/useAuth"
import { 
  Position, 
  Trade, 
  PortfolioSummary, 
  PnLData, 
  Holding, 
  HoldingsSummary, 
  DailyPnL, 
  RiskMetrics 
} from "@/types"

// Market Data Types
interface Instrument {
  ExchangeSegment: string
  ExchangeInstrumentID: string
  InstrumentType?: string
  Name: string
  DisplayName: string
  Symbol: string
  ISIN: string
}

interface MarketQuote {
  ExchangeInstrumentID: string
  LastTradedPrice: string
  Open: string
  High: string
  Low: string
  Close: string
  Volume: string
  BidPrice: string
  AskPrice: string
  BidQuantity: string
  AskQuantity: string
  Change: string
  ChangePercent: string
}

interface MarketDataResponse {
  type: string
  result: {
    listQuotes: MarketQuote[]
  }
}

interface SearchResponse {
  type: string
  query: string
  total_found: number
  returned: number
  results: Instrument[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState("holdings")
  const [mounted, setMounted] = useState(false)
  
  // Use contexts for data management
  const { user, isAuthenticated } = useAuth()
  const { positions, trades, fetchPositions, fetchTrades, loading: tradingLoading } = useTrading()
  const {
    portfolioSummary,
    pnlData,
    holdings,
    holdingsSummary,
    dailyPnL,
    riskMetrics,
    loading: portfolioLoading,
    refreshAll: refreshPortfolio,
  } = usePortfolio()
  
  // Stock scores state (still local as it's computed)
  const [stockScores, setStockScores] = useState<Record<string, number | null>>({})
  

  
  // Market data form state  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Instrument[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  

  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])



  const verifyApiCredentials = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        window.location.href = "/login"
        return
      }
      

      
      // For real Google OAuth authentication, verify with backend
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })
      
      if (response.ok) {
        const user = await response.json()
        
        if (user.has_iifl_market_credentials || user.has_iifl_interactive_credentials) {
          showAlert('success', 'API credentials verified successfully!')
          loadAllData()
        } else {
          // User needs to complete setup
          showAlert('error', 'IIFL API credentials not found. Redirecting to setup...')
          setTimeout(() => {
            router.push('/setup')
          }, 2000)
        }
      } else {
        // Token is invalid, redirect to login
        localStorage.removeItem('token')
        window.location.href = "/login"
      }
    } catch (credError) {
      console.error('Error verifying credentials:', credError)
      showAlert('error', 'Failed to verify API credentials')
    }
  }, [])

  // Load credentials and initial data on mount
  useEffect(() => {
    if (mounted) {
      const token = localStorage.getItem('token')
      if (token) {
        verifyApiCredentials()
      } else {
        window.location.href = "/login"
      }
    }
  }, [mounted, verifyApiCredentials])

  const apiCall = async (endpoint: string, method: string = 'GET', body?: object) => {
    const { ApiClient } = await import('@/services/api-client.service')
    
    const result = await ApiClient.makeRequest(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined
    })

    if (result.error) {
      throw new Error(result.error)
    }

    return result.data
  }

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadPositions(),
        loadTrades(),
        loadPortfolioData()
      ])
      setLastUpdated(new Date())
    } catch (_error) {
      console.error('Error loading data:', _error)
      showAlert('error', 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPortfolioData = async () => {
    try {
      console.log('🚀 Dashboard - Starting portfolio data load...')
      
      // Use context methods to fetch all portfolio data
      await refreshPortfolio()

      // Fetch stock scores for holdings
      await loadStockScores(holdingsSummary, holdings)
    } catch (_error) {
      console.error('❌ Dashboard - Error loading portfolio data:', _error)
    }
  }

  const loadStockScores = async (holdingsSummaryData: HoldingsSummary | null, holdingsData: Holding[] | null) => {
    try {
      console.log('🔍 Dashboard - Loading stock scores...')
      
      // Extract stock symbols from holdings data
      const symbols: string[] = []
      
      // Get symbols from holdings summary (preferred)
      if (holdingsSummaryData?.holdings) {
        holdingsSummaryData.holdings.forEach(holding => {
          if (holding.stock_name) {
            symbols.push(holding.stock_name.toUpperCase())
          }
        })
      }
      
      // Fallback to holdings data if summary not available
      if (symbols.length === 0 && holdingsData) {
        holdingsData.forEach(holding => {
          if (holding.instrument) {
            symbols.push(holding.instrument.toUpperCase())
          }
        })
      }
      
      console.log('🔍 Dashboard - Extracted symbols for scoring:', symbols)
      
      if (symbols.length > 0) {
        const scores = await TradingService.getStockScores(symbols)
        console.log('✅ Dashboard - Stock scores loaded:', scores)
        setStockScores(scores)
      } else {
        console.log('⚠️ Dashboard - No symbols found for scoring')
        setStockScores({})
      }
    } catch (error) {
      console.error('❌ Dashboard - Error loading stock scores:', error)
      setStockScores({})
    }
  }

  const updatePortfolioPrices = async () => {
    try {
      const { PortfolioService } = await import('@/services/portfolio/portfolio.service')
      await PortfolioService.updatePortfolioPrices()
      showAlert('success', 'Portfolio prices updated successfully!')
      await refreshPortfolio()
    } catch (_error) {
      showAlert('error', 'Failed to update portfolio prices')
    }
  }

  // Positions and trades are now managed by TradingContext
  const loadPositions = async () => {
    await fetchPositions()
  }

  const loadTrades = async () => {
    await fetchTrades()
  }







  const squareOffPosition = async (positionId: string) => {
    try {
      console.log('🔍 Dashboard - Squaring off position:', positionId)
      await apiCall(`${API_ENDPOINTS.SQUARE_OFF}/${positionId}/square-off`, 'POST')
      showAlert('success', 'Position squared off successfully!')
      // Refresh positions and trades after squaring off
      await Promise.all([loadPositions(), loadTrades()])
    } catch (_error) {
      console.error('❌ Dashboard - Error squaring off position:', _error)
      showAlert('error', 'Failed to square off position')
    }
  }

  const refreshPositionsData = async () => {
    try {
      console.log('🔍 Dashboard - Refreshing positions data...')
      await Promise.all([fetchPositions(), fetchTrades()])
      showAlert('success', 'Positions data refreshed successfully!')
    } catch (_error) {
      console.error('❌ Dashboard - Error refreshing positions data:', _error)
      showAlert('error', 'Failed to refresh positions data')
    }
  }

  // Market Data Functions
  const searchInstruments = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    
    setIsSearching(true)
    try {
      const response: SearchResponse = await apiCall(
        `${API_ENDPOINTS.MARKET_SEARCH_INSTRUMENTS}?q=${encodeURIComponent(query)}&limit=10`
      )
      setSearchResults(response.results || [])
      setShowDropdown(true)
    } catch (_error) {
      showAlert('error', 'Failed to search instruments')
      setSearchResults([])
      setShowDropdown(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      searchInstruments(value)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  const viewInstrumentDetails = (instrument: Instrument) => {
    router.push(`/market/${instrument.ExchangeInstrumentID}`)
    setSearchQuery("")
    setShowDropdown(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    console.log('User logged out')
    window.location.href = "/"
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message)
      setShowSuccess(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } else {
      setError(message)
      setShowError(true)
      // Auto-dismiss after 8 seconds for errors
      setTimeout(() => {
        setShowError(false)
      }, 8000)
    }
  }

  const dismissAlert = (type: 'success' | 'error') => {
    if (type === 'success') {
      setShowSuccess(false)
    } else {
      setShowError(false)
    }
  }

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'FILLED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PARTIALLY_FILLED':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }



  if (!mounted) {
    return (
      <Layout title="Trading Dashboard">
        <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Trading Dashboard"
      onRefresh={loadAllData}
      isLoading={isLoading}
    >
      {/* Alerts */}
      {showError && error && (
        <div className="mb-6 animate-fade-in">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
              <button
                onClick={() => dismissAlert('error')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccess && success && (
        <div className="mb-6 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-700 font-medium">{success}</span>
              </div>
              <button
                onClick={() => dismissAlert('success')}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl shadow-premium border border-gray-200">
          <TabsTrigger value="holdings" className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md data-[state=active]:scale-105 text-gray-700 transition-all duration-300">Holdings</TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md data-[state=active]:scale-105 text-gray-700 transition-all duration-300">Positions</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-6 mt-6">
          <PortfolioTab
            portfolioSummary={portfolioSummary}
            pnlData={pnlData}
            holdings={holdings || []}
            holdingsSummary={holdingsSummary}
            dailyPnL={dailyPnL}
            riskMetrics={riskMetrics}
            stockScores={stockScores}
            loading={portfolioLoading}
            onRefresh={loadPortfolioData}
            onUpdatePrices={updatePortfolioPrices}
            positions={positions}
            trades={trades}
            onSquareOffPosition={squareOffPosition}
          />
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-6 mt-6">
          <PositionsTab
            positions={positions}
            trades={trades}
            loading={isLoading}
            onRefresh={refreshPositionsData}
            onSquareOffPosition={squareOffPosition}
          />
        </TabsContent>
      </Tabs>
      

    </Layout>
  )
}