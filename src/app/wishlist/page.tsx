"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Heart,
  HeartOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
  Trash2
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

export default function WishlistPage() {
  const router = useRouter()
  const [wishlist, setWishlist] = useState<Instrument[]>([])
  const [marketData, setMarketData] = useState<MarketQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadWishlist()
  }, [])

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

  const loadWishlist = () => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlist(savedWishlist)
    
    if (savedWishlist.length > 0) {
      loadMarketData(savedWishlist)
    } else {
      setIsLoading(false)
    }
  }

  const loadMarketData = async (instruments: Instrument[]) => {
    try {
      const instrumentsData = instruments.map(inst => ({
        exchangeSegment: inst.ExchangeSegment,
        exchangeInstrumentID: inst.ExchangeInstrumentID
      }))
      
      const response: MarketDataResponse = await apiCall(API_ENDPOINTS.MARKET_GET_QUOTES, 'POST', {
        instruments: instrumentsData
      })
      
      setMarketData(response.result.listQuotes || [])
    } catch (err) {
      console.error('Error loading market data:', err)
      setError('Failed to load market data')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadMarketData(wishlist)
    } finally {
      setIsRefreshing(false)
    }
  }

  const removeFromWishlist = (instrumentId: string) => {
    const updatedWishlist = wishlist.filter(item => item.ExchangeInstrumentID !== instrumentId)
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
    setWishlist(updatedWishlist)
    
    // Update market data
    const updatedMarketData = marketData.filter(item => item.ExchangeInstrumentID !== instrumentId)
    setMarketData(updatedMarketData)
  }

  const clearWishlist = () => {
    localStorage.removeItem('wishlist')
    setWishlist([])
    setMarketData([])
  }

  const getMarketDataForInstrument = (instrumentId: string) => {
    return marketData.find(quote => quote.ExchangeInstrumentID === instrumentId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    )
  }

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
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-600" />
                <span className="text-xl font-bold text-gray-900">My Wishlist</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {wishlist.length} items
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {wishlist.length > 0 && (
                <>
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
                    onClick={clearWishlist}
                    variant="outline"
                    size="sm"
                    className="bg-white text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">
            Track your favorite instruments and their market performance
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {wishlist.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-6">
                Start adding instruments to your wishlist to track their market performance
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Go to Market Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Wishlist Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Wishlist Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{wishlist.length}</div>
                    <div className="text-sm text-gray-500">Total Instruments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {marketData.filter(q => parseFloat(q.Change) >= 0).length}
                    </div>
                    <div className="text-sm text-gray-500">Gainers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {marketData.filter(q => parseFloat(q.Change) < 0).length}
                    </div>
                    <div className="text-sm text-gray-500">Losers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {marketData.filter(q => parseFloat(q.Change) === 0).length}
                    </div>
                    <div className="text-sm text-gray-500">Unchanged</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wishlist Items */}
            <div className="grid gap-4">
              {wishlist.map((instrument) => {
                const quote = getMarketDataForInstrument(instrument.ExchangeInstrumentID)
                const change = quote ? parseFloat(quote.Change) : 0
                const changePercent = quote ? parseFloat(quote.ChangePercent) : 0
                const isPositive = change >= 0

                return (
                  <Card key={instrument.ExchangeInstrumentID} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {instrument.DisplayName || instrument.Name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {instrument.Symbol} • {instrument.ExchangeSegment}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              ID: {instrument.ExchangeInstrumentID}
                            </Badge>
                          </div>
                          
                          {quote ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <div className="text-sm text-gray-500">LTP</div>
                                <div className="text-lg font-bold">₹{quote.LastTradedPrice}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Change</div>
                                <div className={`text-lg font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : ''}{quote.Change} ({isPositive ? '+' : ''}{quote.ChangePercent}%)
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Volume</div>
                                <div className="text-sm font-medium">{parseInt(quote.Volume).toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Bid/Ask</div>
                                <div className="text-sm font-medium">₹{quote.BidPrice} / ₹{quote.AskPrice}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mt-2">No market data available</div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => router.push(`/market/${instrument.ExchangeInstrumentID}`)}
                            variant="outline"
                            size="sm"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => removeFromWishlist(instrument.ExchangeInstrumentID)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 