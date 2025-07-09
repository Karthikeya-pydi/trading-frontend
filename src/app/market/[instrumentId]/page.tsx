"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Heart,
  HeartOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  Activity,
  Target,
  Clock
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

// Types
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

export default function InstrumentPage() {
  const params = useParams()
  const router = useRouter()
  const instrumentId = params.instrumentId as string
  
  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [marketData, setMarketData] = useState<MarketQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (instrumentId) {
      loadInstrumentData()
      checkWishlistStatus()
    }
  }, [instrumentId])

  const apiCall = async (endpoint: string, method: string = 'GET', body?: object) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || response.statusText)
    }

    return response.json()
  }

  const loadInstrumentData = async () => {
    setIsLoading(true)
    try {
      // First, get instrument details by searching
      const searchResponse = await apiCall(
        `${API_ENDPOINTS.MARKET_SEARCH_INSTRUMENTS}?q=${encodeURIComponent(instrumentId)}&limit=50`
      )
      
      const foundInstrument = searchResponse.results?.find(
        (inst: Instrument) => inst.ExchangeInstrumentID === instrumentId
      )
      
      if (!foundInstrument) {
        setError('Instrument not found')
        return
      }
      
      setInstrument(foundInstrument)
      
      // Get market data for this instrument
      const marketResponse: MarketDataResponse = await apiCall(API_ENDPOINTS.MARKET_GET_QUOTES, 'POST', {
        instruments: [{
          exchangeSegment: foundInstrument.ExchangeSegment,
          exchangeInstrumentID: foundInstrument.ExchangeInstrumentID
        }]
      })
      
      const quote = marketResponse.result.listQuotes?.[0]
      if (quote) {
        setMarketData(quote)
      }
      
    } catch (err) {
      console.error('Error loading instrument data:', err)
      setError('Failed to load instrument data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkWishlistStatus = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setIsInWishlist(wishlist.some((item: Instrument) => item.ExchangeInstrumentID === instrumentId))
  }

  const toggleWishlist = () => {
    if (!instrument) return
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    
    if (isInWishlist) {
      const updatedWishlist = wishlist.filter((item: Instrument) => item.ExchangeInstrumentID !== instrumentId)
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
      setIsInWishlist(false)
    } else {
      wishlist.push(instrument)
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
      setIsInWishlist(true)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadInstrumentData()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading instrument data...</p>
        </div>
      </div>
    )
  }

  if (error || !instrument) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error || 'Instrument not found'}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const change = marketData ? parseFloat(marketData.Change) : 0
  const changePercent = marketData ? parseFloat(marketData.ChangePercent) : 0
  const isPositive = change >= 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Market Data</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshData}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={toggleWishlist}
                variant={isInWishlist ? "default" : "outline"}
                size="sm"
                className={isInWishlist ? "bg-red-600 hover:bg-red-700" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}
              >
                {isInWishlist ? (
                  <>
                    <HeartOff className="h-4 w-4 mr-2" />
                    Remove from Wishlist
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Wishlist
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Instrument Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {instrument.DisplayName || instrument.Name}
              </h1>
              <p className="text-gray-600 mt-1">
                {instrument.Symbol} • {instrument.ExchangeSegment} • ID: {instrument.ExchangeInstrumentID}
              </p>
              {instrument.ISIN && (
                <p className="text-sm text-gray-500 mt-1">ISIN: {instrument.ISIN}</p>
              )}
            </div>
            {marketData && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  ₹{marketData.LastTradedPrice}
                </div>
                <div className={`text-lg font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{marketData.Change} ({isPositive ? '+' : ''}{marketData.ChangePercent}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {marketData ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Price Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Price Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Last Traded Price</div>
                      <div className="text-xl font-bold">₹{marketData.LastTradedPrice}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Change</div>
                      <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{marketData.Change}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Change %</div>
                      <div className={`text-lg font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{marketData.ChangePercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Volume</div>
                      <div className="text-lg font-medium">{parseInt(marketData.Volume).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OHLC Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>OHLC Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Open</div>
                    <div className="text-lg font-medium">₹{marketData.Open}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">High</div>
                    <div className="text-lg font-medium text-green-600">₹{marketData.High}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Low</div>
                    <div className="text-lg font-medium text-red-600">₹{marketData.Low}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Close</div>
                    <div className="text-lg font-medium">₹{marketData.Close}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid/Ask Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Bid/Ask Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Bid</div>
                    <div className="text-xl font-bold text-green-600">₹{marketData.BidPrice}</div>
                    <div className="text-sm text-gray-500 mt-1">Qty: {marketData.BidQuantity}</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Ask</div>
                    <div className="text-xl font-bold text-red-600">₹{marketData.AskPrice}</div>
                    <div className="text-sm text-gray-500 mt-1">Qty: {marketData.AskQuantity}</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-500">Spread</div>
                  <div className="text-lg font-medium">
                    ₹{(parseFloat(marketData.AskPrice) - parseFloat(marketData.BidPrice)).toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span>Market Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Instrument ID</span>
                    <span className="font-medium">{marketData.ExchangeInstrumentID}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Price Movement</span>
                    <Badge variant={isPositive ? "default" : "secondary"} className={isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {isPositive ? 'Bullish' : 'Bearish'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No market data available for this instrument</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 