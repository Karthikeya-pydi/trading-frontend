"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  DollarSign,
  Volume2,
  Clock,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"
import { 
  StockDataResponse, 
  StockInfo, 
  TouchlineQuote, 
  MarketDepthQuote, 
  OHLCQuote 
} from "@/types"

interface StockDataTabProps {
  onRefresh?: () => void
  initialSearch?: string
}

interface ProcessedStockData extends Omit<StockDataResponse, 'market_data' | 'historical_data'> {
  market_data: {
    touchline: {
      listQuotes: TouchlineQuote[]
    }
    market_depth: {
      listQuotes: MarketDepthQuote[]
    }
  }
  historical_data: {
    ohlc: {
      listQuotes: OHLCQuote[]
    }
  }
}

export function StockDataTab({ onRefresh, initialSearch = "" }: StockDataTabProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [stockData, setStockData] = useState<ProcessedStockData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Utility functions for safe data handling
  const safeToFixed = useCallback((value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.00'
    return Number(value).toFixed(decimals)
  }, [])

  const safeToLocaleString = useCallback((value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return Number(value).toLocaleString()
  }, [])

  const getChangeColor = useCallback((change: number | undefined | null): string => {
    if (change === undefined || change === null) return 'text-gray-600'
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }, [])

  const getChangeIcon = useCallback((change: number | undefined | null) => {
    if (change === undefined || change === null) return <Activity className="h-4 w-4" />
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }, [])

  // Parse historical data from pipe-separated format
  const parseHistoricalData = useCallback((dataResponse: string): OHLCQuote[] => {
    if (!dataResponse) return []
    
    try {
      return dataResponse.split(',').map((entry) => {
        const parts = entry.split('|')
        if (parts.length >= 6) {
          return {
            DateTime: new Date(parseInt(parts[0]) * 1000).toISOString().split('T')[0],
            Open: parseFloat(parts[1]) || 0,
            High: parseFloat(parts[2]) || 0,
            Low: parseFloat(parts[3]) || 0,
            Close: parseFloat(parts[4]) || 0,
            Volume: parseInt(parts[5]) || 0
          }
        }
        return null
      }).filter(Boolean) as OHLCQuote[]
    } catch (e) {
      console.error('Error parsing historical data:', e)
      return []
    }
  }, [])

  // Process raw API response
  const processApiResponse = useCallback((data: StockDataResponse): ProcessedStockData => {
    return {
      ...data,
      market_data: {
        ...data.market_data,
        touchline: {
          ...data.market_data.touchline,
          listQuotes: data.market_data.touchline.listQuotes.map((quote: string) => {
            try {
              return JSON.parse(quote) as TouchlineQuote
            } catch (e) {
              console.error('Error parsing touchline quote:', e)
              return null
            }
          }).filter((quote): quote is TouchlineQuote => quote !== null)
        },
        market_depth: {
          ...data.market_data.market_depth,
          listQuotes: data.market_data.market_depth.listQuotes.map((quote: string) => {
            try {
              return JSON.parse(quote) as MarketDepthQuote
            } catch (e) {
              console.error('Error parsing market depth quote:', e)
              return null
            }
          }).filter((quote): quote is MarketDepthQuote => quote !== null)
        }
      },
      historical_data: {
        ...data.historical_data,
        ohlc: {
          ...data.historical_data.ohlc,
          listQuotes: parseHistoricalData(data.historical_data.ohlc.dataReponse)
        }
      }
    }
  }, [parseHistoricalData])

  // Fetch stock data from API
  const fetchStockData = useCallback(async (stockName: string, usePost: boolean = false) => {
    if (!stockName.trim()) {
      setError("Please enter a stock symbol")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      let response: Response

      if (usePost) {
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_DATA_POST}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            stock_name: stockName.toUpperCase()
          })
        })
      } else {
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STOCK_DATA_GET}/${stockName.toUpperCase()}`, {
          headers
        })
      }

      const data = await response.json()

      if (response.ok && data.type === 'success') {
        const processedData = processApiResponse(data)
        setStockData(processedData)
        setSuccess(`Successfully fetched data for ${stockName.toUpperCase()}`)
        setLastUpdated(new Date())
      } else {
        setError(data.detail || `Failed to fetch data for ${stockName}`)
        setStockData(null)
      }
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError(`Failed to fetch stock data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }, [processApiResponse])

  // Event handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchStockData(searchQuery.trim())
    }
  }, [searchQuery, fetchStockData])

  const handleQuickSearch = useCallback((symbol: string) => {
    setSearchQuery(symbol)
    fetchStockData(symbol)
  }, [fetchStockData])

  const toggleAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      setAutoRefresh(false)
    } else {
      if (stockData && searchQuery.trim()) {
        const interval = setInterval(() => {
          fetchStockData(searchQuery.trim())
        }, 30000)
        setRefreshInterval(interval)
        setAutoRefresh(true)
      }
    }
  }, [autoRefresh, refreshInterval, stockData, searchQuery, fetchStockData])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  // Auto-search when initialSearch is provided
  useEffect(() => {
    if (initialSearch && initialSearch.trim()) {
      fetchStockData(initialSearch.trim())
    }
  }, [initialSearch, fetchStockData])

  // Memoized components for better performance
  const MarketDepthDisplay = useMemo(() => {
    if (!stockData?.market_data?.market_depth?.listQuotes?.length) {
      return <p className="text-gray-500 text-center">No market depth data available</p>
    }

    const quote = stockData.market_data.market_depth.listQuotes[0]
    if (!quote?.Bids || !quote?.Asks) {
      return <p className="text-gray-500 text-center">No market depth data available</p>
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-green-600 mb-2">Bids</h4>
          <div className="space-y-1">
            {quote.Bids.slice(0, 5).map((bid, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-green-600">₹{safeToFixed(bid.Price)}</span>
                <span className="text-gray-600">{safeToLocaleString(bid.Size)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Asks</h4>
          <div className="space-y-1">
            {quote.Asks.slice(0, 5).map((ask, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-red-600">₹{safeToFixed(ask.Price)}</span>
                <span className="text-gray-600">{safeToLocaleString(ask.Size)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }, [stockData, safeToFixed, safeToLocaleString])

  const HistoricalDataDisplay = useMemo(() => {
    if (!stockData?.historical_data?.ohlc?.listQuotes?.length) {
      return <p className="text-gray-500 text-center">No historical data available</p>
    }

    return (
      <div className="space-y-2">
        {stockData.historical_data.ohlc.listQuotes.slice(0, 5).map((quote, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              {quote.DateTime ? new Date(quote.DateTime).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex space-x-4 text-sm">
              <span>O: ₹{safeToFixed(quote.Open)}</span>
              <span>H: ₹{safeToFixed(quote.High)}</span>
              <span>L: ₹{safeToFixed(quote.Low)}</span>
              <span>C: ₹{safeToFixed(quote.Close)}</span>
              <span>V: {safeToLocaleString(quote.Volume)}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }, [stockData, safeToFixed, safeToLocaleString])

  const CurrentPriceDisplay = useMemo(() => {
    if (!stockData?.market_data?.touchline?.listQuotes?.[0]) {
      return <p className="text-gray-500 text-center">No market data available</p>
    }

    const quote = stockData.market_data.touchline.listQuotes[0]
    const priceChange = quote.LastTradedPrice - quote.Close

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            ₹{safeToFixed(quote.LastTradedPrice)}
          </div>
          <div className={`flex items-center justify-center space-x-2 mt-2 ${getChangeColor(quote.PercentChange)}`}>
            {getChangeIcon(quote.PercentChange)}
            <span className="font-semibold">
              {quote.PercentChange >= 0 ? '+' : ''}
              {safeToFixed(quote.PercentChange)}%
            </span>
            <span className="text-sm">
              ₹{safeToFixed(priceChange)}
            </span>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-500">Open</Label>
            <p className="font-semibold">₹{safeToFixed(quote.Open)}</p>
          </div>
          <div>
            <Label className="text-gray-500">Close</Label>
            <p className="font-semibold">₹{safeToFixed(quote.Close)}</p>
          </div>
          <div>
            <Label className="text-gray-500">High</Label>
            <p className="font-semibold text-green-600">₹{safeToFixed(quote.High)}</p>
          </div>
          <div>
            <Label className="text-gray-500">Low</Label>
            <p className="font-semibold text-red-600">₹{safeToFixed(quote.Low)}</p>
          </div>
        </div>
        
        <div>
          <Label className="text-gray-500">Volume</Label>
          <p className="font-semibold flex items-center">
            <Volume2 className="h-4 w-4 mr-1" />
            {safeToLocaleString(quote.TotalTradedQuantity)}
          </p>
        </div>
      </div>
    )
  }, [stockData, safeToFixed, safeToLocaleString, getChangeColor, getChangeIcon])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Data</h2>
          <p className="text-gray-600 mt-1">Real-time market data and historical information</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            disabled={!stockData}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto Refresh ON" : "Auto Refresh"}
          </Button>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Search Stock Data</span>
          </CardTitle>
          <CardDescription>
            Enter a stock symbol to fetch real-time market data, market depth, and historical information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !searchQuery.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Search</span>
              </Button>
            </div>

            {/* Quick Search Buttons */}
            <div className="flex flex-wrap gap-2">
              <Label className="text-sm font-medium text-gray-700">Quick Search:</Label>
              {['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'BEL'].map((symbol) => (
                <Button
                  key={symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSearch(symbol)}
                  disabled={loading}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stock Data Display */}
      {stockData && (
        <div className="space-y-6">
          {/* Stock Info Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {stockData.stock_info?.name || 'Unknown Stock'}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {stockData.stock_info?.symbol || 'N/A'} • {stockData.stock_info?.series || 'N/A'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    ISIN: {stockData.stock_info?.isin || 'N/A'}
                  </Badge>
                  {lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Market Data Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Price & Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Current Price</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {CurrentPriceDisplay}
              </CardContent>
            </Card>

            {/* Market Depth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Market Depth</span>
                </CardTitle>
                <CardDescription>Top 5 bids and asks</CardDescription>
              </CardHeader>
              <CardContent>
                {MarketDepthDisplay}
              </CardContent>
            </Card>

            {/* Stock Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span>Stock Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Instrument ID</Label>
                    <span className="font-mono">{stockData.stock_info?.instrument_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Exchange Segment</Label>
                    <span>{stockData.stock_info?.exchange_segment || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Lot Size</Label>
                    <span>{stockData.stock_info?.lot_size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Tick Size</Label>
                    <span>₹{stockData.stock_info?.tick_size || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Price Band High</Label>
                    <span className="text-green-600">₹{stockData.stock_info?.price_band_high || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-gray-500">Price Band Low</Label>
                    <span className="text-red-600">₹{stockData.stock_info?.price_band_low || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Historical Data (OHLC)</span>
              </CardTitle>
              <CardDescription>Recent trading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {HistoricalDataDisplay}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!stockData && !loading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for Stock Data</h3>
            <p className="text-gray-600 mb-4">
              Enter a stock symbol above to view real-time market data, market depth, and historical information.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'BEL'].map((symbol) => (
                <Button
                  key={symbol}
                  variant="outline"
                  onClick={() => handleQuickSearch(symbol)}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 