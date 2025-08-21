'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, Activity, Globe, BarChart3, RefreshCw } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

interface MarketData {
  nifty50: {
    current: number
    change: number
    changePercent: number
    high: number
    low: number
    volume: number
  }
  sensex: {
    current: number
    change: number
    changePercent: number
    high: number
    low: number
    volume: number
  }
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_CLOSE'
  lastUpdate: string
}

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchMarketData = async () => {
    setLoading(true)
    setError('')

    try {
      // For now, we'll use mock data since the actual endpoint isn't provided
      // This can be replaced with real API call when available
      const mockData: MarketData = {
        nifty50: {
          current: 22450.75,
          change: 125.50,
          changePercent: 0.56,
          high: 22500.25,
          low: 22350.00,
          volume: 125000000
        },
        sensex: {
          current: 73850.25,
          change: 450.75,
          changePercent: 0.61,
          high: 74000.00,
          low: 73600.50,
          volume: 98000000
        },
        marketStatus: 'OPEN',
        lastUpdate: new Date().toISOString()
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMarketData(mockData)
      setError('')
    } catch (err: any) {
      console.error('❌ MarketOverview - Error fetching market data:', err)
      setError(err.message || 'Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }

  const refreshMarketData = async () => {
    setRefreshing(true)
    await fetchMarketData()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchMarketData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PRE_OPEN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'POST_CLOSE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMarketStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Activity className="h-4 w-4 text-green-600" />
      case 'CLOSED':
        return <Activity className="h-4 w-4 text-red-600" />
      case 'PRE_OPEN':
        return <Activity className="h-4 w-4 text-yellow-600" />
      case 'POST_CLOSE':
        return <Activity className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading && !marketData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading market data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Market Overview</h3>
          <Badge variant="outline" className={getMarketStatusColor(marketData?.marketStatus || 'CLOSED')}>
            <div className="flex items-center space-x-1">
              {getMarketStatusIcon(marketData?.marketStatus || 'CLOSED')}
              <span>{marketData?.marketStatus || 'CLOSED'}</span>
            </div>
          </Badge>
        </div>
        <Button
          onClick={refreshMarketData}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Market Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nifty 50 */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>NIFTY 50</span>
              </span>
              <Badge variant="outline" className="text-xs">
                NSE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketData?.nifty50 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{marketData.nifty50.current.toFixed(2)}
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    marketData.nifty50.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketData.nifty50.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-semibold">
                      {marketData.nifty50.change >= 0 ? '+' : ''}
                      ₹{marketData.nifty50.change.toFixed(2)} 
                      ({marketData.nifty50.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">High</span>
                    <div className="font-medium text-green-600">
                      ₹{marketData.nifty50.high.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Low</span>
                    <div className="font-medium text-red-600">
                      ₹{marketData.nifty50.low.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <div className="font-medium">
                      {formatNumber(marketData.nifty50.volume)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sensex */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>SENSEX</span>
              </span>
              <Badge variant="outline" className="text-xs">
                BSE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketData?.sensex ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{marketData.sensex.current.toFixed(2)}
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    marketData.sensex.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketData.sensex.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-semibold">
                      {marketData.sensex.change >= 0 ? '+' : ''}
                      ₹{marketData.sensex.change.toFixed(2)} 
                      ({marketData.sensex.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">High</span>
                    <div className="font-medium text-green-600">
                      ₹{marketData.sensex.high.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Low</span>
                    <div className="font-medium text-red-600">
                      ₹{marketData.sensex.low.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <div className="font-medium">
                      {formatNumber(marketData.sensex.volume)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Status Info */}
      {marketData && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                <strong>Last Update:</strong> {formatTime(marketData.lastUpdate)}
              </span>
              <span>
                <strong>Market Status:</strong> {marketData.marketStatus}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Features */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">More Market Data Coming Soon</h4>
          <p className="text-gray-500 text-sm mb-4">
            We're working on adding more comprehensive market data including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
            <div>• Sector Performance</div>
            <div>• Top Gainers/Losers</div>
            <div>• Market Breadth</div>
            <div>• FII/DII Activity</div>
            <div>• Currency Rates</div>
            <div>• Commodity Prices</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

