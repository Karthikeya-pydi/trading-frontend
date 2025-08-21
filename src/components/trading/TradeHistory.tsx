'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, Filter, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

interface Trade {
  trade_id: string
  symbol: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
  timestamp: string
  order_id?: string | number  // Allow both string and number types
  execution_time?: string
  taxes?: number
  net_amount?: number
}

// Updated interface to handle IIFL API response structure
interface TradeHistoryResponse {
  type?: string
  status?: string
  result?: {
    trades?: Trade[]
    totalTrades?: number
    buyTrades?: number
    sellTrades?: number
  }
  trades?: Trade[]
  message?: string
}

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterSide, setFilterSide] = useState<string>('ALL')
  const [searchSymbol, setSearchSymbol] = useState('')
  const [dateRange, setDateRange] = useState<string>('7D')
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrades = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to view trades')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/trading/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Log the raw response for debugging
      console.log('📊 TradeHistory - Response status:', response.status)
      console.log('📊 TradeHistory - Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.log('📊 TradeHistory - Error response:', errorData)
        
        // Handle specific backend validation errors
        if (errorData.detail && errorData.detail.includes('order_id') && errorData.detail.includes('string_type')) {
          throw new Error('Backend validation error: order_id type mismatch. This is a known issue being resolved.')
        }
        
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to fetch trades`)
      }

      const data: TradeHistoryResponse = await response.json()
      console.log('📊 TradeHistory - Success response data:', data)
      
      // Handle different IIFL API response formats
      if (data && typeof data === 'object') {
        if (data.type === 'success' && data.result && Array.isArray(data.result)) {
          // The result is directly an array of trades
          setTrades(data.result)
        } else if (data.type === 'success' && data.result && data.result.trades && Array.isArray(data.result.trades)) {
          // IIFL API success response with result.trades
          setTrades(data.result.trades)
        } else if (data.status === 'success' && Array.isArray(data.trades)) {
          // Legacy success response with trades array
          setTrades(data.trades)
        } else if (Array.isArray(data)) {
          // Direct array response
          setTrades(data)
        } else if (data.trades && Array.isArray(data.trades)) {
          // Response with trades array but no status
          setTrades(data.trades)
        } else if (data.result && Array.isArray(data.result.trades)) {
          // Response with result.trades but no type
          setTrades(data.result.trades)
        } else {
          console.warn('📊 TradeHistory - Unexpected response format:', data)
          setTrades([])
          setError('Unexpected response format from server')
        }
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (err: any) {
      console.error('❌ TradeHistory - Error fetching trades:', err)
      setError(err.message || 'Failed to fetch trades')
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  const refreshTrades = async () => {
    setRefreshing(true)
    await fetchTrades()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  // Filter trades based on current filters
  const filteredTrades = trades.filter(trade => {
    const matchesSide = filterSide === 'ALL' || trade.side === filterSide
    const matchesSymbol = !searchSymbol || 
      trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
    
    // Date filtering logic can be added here based on dateRange
    let matchesDate = true
    if (dateRange !== 'ALL') {
      const tradeDate = new Date(trade.timestamp)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - tradeDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      switch (dateRange) {
        case '1D':
          matchesDate = diffDays <= 1
          break
        case '7D':
          matchesDate = diffDays <= 7
          break
        case '30D':
          matchesDate = diffDays <= 30
          break
        case '90D':
          matchesDate = diffDays <= 90
          break
      }
    }
    
    return matchesSide && matchesSymbol && matchesDate
  })

  const getSideIcon = (side: string) => {
    return side === 'BUY' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      })
    }
  }

  // Calculate summary statistics
  const totalTrades = filteredTrades.length
  const buyTrades = filteredTrades.filter(t => t.side === 'BUY')
  const sellTrades = filteredTrades.filter(t => t.side === 'SELL')
  const totalVolume = filteredTrades.reduce((sum, t) => sum + t.quantity, 0)
  const totalValue = filteredTrades.reduce((sum, t) => sum + (t.quantity * t.price), 0)
  const avgTradeSize = totalTrades > 0 ? totalValue / totalTrades : 0

  if (loading && trades.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading trade history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Trade History</h3>
          <Badge variant="outline">{filteredTrades.length} trades</Badge>
        </div>
        <Button
          onClick={refreshTrades}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTrades}</div>
              <div className="text-sm text-blue-600">Total Trades</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{buyTrades.length}</div>
              <div className="text-sm text-green-600">Buy Trades</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{sellTrades.length}</div>
              <div className="text-sm text-red-600">Sell Trades</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-purple-600">Total Volume</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Total Value</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Avg Trade Size</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{avgTradeSize.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Side Filter */}
            <div className="space-y-2">
              <Label htmlFor="side-filter">Side</Label>
              <Select value={filterSide} onValueChange={setFilterSide}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sides</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="1D">Last 24 Hours</SelectItem>
                  <SelectItem value="7D">Last 7 Days</SelectItem>
                  <SelectItem value="30D">Last 30 Days</SelectItem>
                  <SelectItem value="90D">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Symbol Search */}
            <div className="space-y-2">
              <Label htmlFor="symbol-search">Search Symbol</Label>
              <Input
                id="symbol-search"
                placeholder="Enter stock symbol..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">{error}</div>
              {error.includes('Backend validation error') && (
                <div className="text-sm bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-800 font-medium">Backend Issue Detected</span>
                  </div>
                  <p className="text-red-700 text-sm">
                    This is a known backend validation issue that's being resolved. 
                    Your trades may have been executed successfully with IIFL, but the backend 
                    response validation is failing due to a type mismatch.
                  </p>
                  <div className="mt-2 text-xs text-red-600">
                    <strong>Technical Details:</strong> Backend expects order_id as string, 
                    but IIFL API returns integer. This will be fixed shortly.
                  </div>
                  <div className="mt-3 text-xs text-red-600">
                    <strong>What to do:</strong> Check your IIFL account directly or contact support to confirm trade status.
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {trades.length === 0 ? (
              <div>
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No trades found</p>
                <p className="text-sm">Start trading to see your trade history here</p>
              </div>
            ) : (
              <div>
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No trades match the current filters</p>
                <p className="text-sm">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => (
            <Card key={trade.trade_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-semibold text-lg">{trade.symbol}</div>
                      <Badge className={getSideColor(trade.side)}>
                        <div className="flex items-center space-x-1">
                          {getSideIcon(trade.side)}
                          <span>{trade.side}</span>
                        </div>
                      </Badge>
                      {trade.order_id && (
                        <Badge variant="outline" className="text-xs">
                          Order: {trade.order_id}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <div className="font-medium">{trade.quantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <div className="font-medium">₹{trade.price.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Value:</span>
                        <div className="font-medium">₹{(trade.quantity * trade.price).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Execution:</span>
                        <div className="font-medium">{formatDateShort(trade.timestamp)}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2 flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(trade.timestamp)}</span>
                      </span>
                      <span>Trade ID: {trade.trade_id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Export Options */}
      {filteredTrades.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredTrades.length} of {trades.length} trades
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
