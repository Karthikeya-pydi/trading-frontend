"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  LogOut, 
  Settings, 
  RefreshCw, 
  Plus,
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Target,
  X,
  PieChart,
  Briefcase,
  Heart,
  Search
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"
import { TradingService } from "@/services/trading.service"
import { PortfolioTab } from "@/components/dashboard/PortfolioTab"

import { 
  Position, 
  Trade, 
  Order, 
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
  const [activeTab, setActiveTab] = useState("portfolio")
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  
  // Portfolio states
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [holdings, setHoldings] = useState<Holding[] | null>(null)
  const [holdingsSummary, setHoldingsSummary] = useState<HoldingsSummary | null>(null)
  const [dailyPnL, setDailyPnL] = useState<DailyPnL | null>(null)
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    underlying_instrument: "",
    quantity: "",
    price: "",
    order_type: "MARKET",
    option_type: "CE",
    strike_price: "",
    expiry_date: ""
  })
  
  // Market data form state  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Instrument[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const verifyApiCredentials = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
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
          setSuccess('API credentials verified successfully!')
          loadAllData()
        } else {
          setError('IIFL API credentials not found. Please configure your API keys.')
        }
      } else {
        throw new Error('Failed to verify credentials')
      }
    } catch (credError) {
      console.error('Error verifying credentials:', credError)
      setError('Failed to verify API credentials')
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

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadPositions(),
        loadTrades(),
        loadOrderBook(),
        loadPortfolioData()
      ])
      setLastUpdated(new Date())
    } catch (_error) {
      console.error('Error loading data:', _error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPortfolioData = async () => {
    setPortfolioLoading(true)
    try {
      const [
        portfolioData,
        pnlData,
        holdingsData,
        holdingsSummaryData,
        dailyPnLData,
        riskMetricsData
      ] = await Promise.all([
        TradingService.getPortfolioSummary().catch(() => null),
        TradingService.getPnLData().catch(() => null),
        TradingService.getHoldings().catch(() => []),
        TradingService.getHoldingsSummary().catch(() => null),
        TradingService.getDailyPnL().catch(() => null),
        TradingService.getRiskMetrics().catch(() => null)
      ])
      
      setPortfolioSummary(portfolioData)
      setPnlData(pnlData)
      setHoldings(holdingsData)
      setHoldingsSummary(holdingsSummaryData)
      setDailyPnL(dailyPnLData)
      setRiskMetrics(riskMetricsData)
    } catch (_error) {
      console.error('Error loading portfolio data:', _error)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const updatePortfolioPrices = async () => {
    setPortfolioLoading(true)
    try {
      await TradingService.updatePortfolioPrices()
      setSuccess('Portfolio prices updated successfully!')
      loadPortfolioData()
    } catch (_error) {
      setError('Failed to update portfolio prices')
    } finally {
      setPortfolioLoading(false)
    }
  }

  const loadPositions = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.POSITIONS)
      // Handle both array response and object with positions property
      setPositions(Array.isArray(data) ? data : (data.positions || []))
    } catch (_error) {
      console.error('Error loading positions:', _error)
    }
  }

  const loadTrades = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.TRADES)
      setTrades(Array.isArray(data) ? data : (data.trades || []))
    } catch (_error) {
      console.error('Error loading trades:', _error)
    }
  }

  const loadOrderBook = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.ORDER_BOOK)
      setOrders(Array.isArray(data) ? data : (data.orders || []))
    } catch (_error) {
      console.error('Error loading order book:', _error)
    }
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const orderData = {
        underlying_instrument: orderForm.underlying_instrument.toUpperCase(),
        option_type: orderForm.option_type,
        strike_price: parseFloat(orderForm.strike_price),
        expiry_date: orderForm.expiry_date,
        order_type: orderForm.order_type,
        quantity: parseInt(orderForm.quantity),
        price: parseFloat(orderForm.price)
      }

      await apiCall(API_ENDPOINTS.PLACE_ORDER, 'POST', orderData)
      
      setSuccess('Order placed successfully!')
      setOrderForm({
        underlying_instrument: "",
        quantity: "",
        price: "",
        order_type: "MARKET", 
        option_type: "CE",
        strike_price: "",
        expiry_date: ""
      })
      
      // Reload order book
      loadOrderBook()
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Failed to place order')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.CANCEL_ORDER}/${orderId}/cancel`, 'PUT')
      setSuccess('Order cancelled successfully!')
      loadOrderBook()
    } catch (_error) {
      setError('Failed to cancel order')
    }
  }

  const squareOffPosition = async (positionId: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.SQUARE_OFF}/${positionId}/square-off`, 'POST')
      setSuccess('Position squared off successfully!')
      loadPositions()
    } catch (_error) {
      setError('Failed to square off position')
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
      setError('Failed to search instruments')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">IIFL Trading</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={loadAllData}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => router.push('/wishlist')}
                variant="outline" 
                size="sm" 
                className="bg-white text-red-600 border-red-300 hover:bg-red-50"
              >
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
              <Button variant="outline" size="sm" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {mounted ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="place-order">Place Order</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioTab
              portfolioSummary={portfolioSummary}
              pnlData={pnlData}
              holdings={holdings}
              holdingsSummary={holdingsSummary}
              dailyPnL={dailyPnL}
              riskMetrics={riskMetrics}
              loading={portfolioLoading}
              onRefresh={loadPortfolioData}
              onUpdatePrices={updatePortfolioPrices}
              positions={[]}
              trades={trades}
              onSquareOffPosition={function (positionId: string): void {
                throw new Error("Function not implemented.")
              }}
            />

            {/* Trades Table (moved from Trades tab) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span>Trade History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trades found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-left p-2">Side</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Price</th>
                          <th className="text-left p-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade) => (
                          <tr key={trade.trade_id} className="border-b">
                            <td className="p-2 font-medium">{trade.symbol}</td>
                            <td className="p-2">
                              <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                                {trade.side}
                              </Badge>
                            </td>
                            <td className="p-2">{trade.quantity}</td>
                            <td className="p-2">₹{trade.price}</td>
                            <td className="p-2">{new Date(trade.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Place Order Tab */}
          <TabsContent value="place-order" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span>Place New Order</span>
                </CardTitle>
                <CardDescription>Enter order details for options trading</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={placeOrder} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="underlying_instrument">Underlying Instrument *</Label>
                      <Input
                        id="underlying_instrument"
                        placeholder="e.g., NIFTY, BANKNIFTY"
                        value={orderForm.underlying_instrument}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, underlying_instrument: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option_type">Option Type</Label>
                      <select
                        id="option_type"
                        className="w-full p-2 border rounded-md"
                        value={orderForm.option_type}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, option_type: e.target.value }))}
                      >
                        <option value="CE">Call (CE)</option>
                        <option value="PE">Put (PE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="strike_price">Strike Price *</Label>
                      <Input
                        id="strike_price"
                        type="number"
                        placeholder="e.g., 18000"
                        value={orderForm.strike_price}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, strike_price: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Expiry Date *</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={orderForm.expiry_date}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="e.g., 50"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order_type">Order Type</Label>
                      <select
                        id="order_type"
                        className="w-full p-2 border rounded-md"
                        value={orderForm.order_type}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value }))}
                      >
                        <option value="MARKET">MARKET</option>
                        <option value="LIMIT">LIMIT</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="Price per unit"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Placing Order..." : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span>Order Book</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active orders</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-left p-2">Side</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Price</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.order_id} className="border-b">
                            <td className="p-2 font-medium">{order.symbol}</td>
                            <td className="p-2">
                              <Badge variant={order.side === 'BUY' ? 'default' : 'secondary'}>
                                {order.side}
                              </Badge>
                            </td>
                            <td className="p-2">{order.quantity}</td>
                            <td className="p-2">₹{order.price}</td>
                            <td className="p-2">{order.order_type}</td>
                            <td className="p-2">
                              <Badge variant="outline">{order.status}</Badge>
                            </td>
                            <td className="p-2">
                              {order.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelOrder(order.order_id)}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Data Tab */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Instrument Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span>Search Instruments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="Search for stocks/instruments to view details..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Dropdown Results */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((instrument) => (
                          <div 
                            key={instrument.ExchangeInstrumentID} 
                            className="flex justify-between items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => viewInstrumentDetails(instrument)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{instrument.DisplayName || instrument.Name}</div>
                              <div className="text-sm text-gray-500">
                                {instrument.ExchangeSegment} • {instrument.Symbol}
                                {instrument.ISIN && ` • ISIN: ${instrument.ISIN}`}
                              </div>
                              <div className="text-xs text-gray-400">ID: {instrument.ExchangeInstrumentID}</div>
                            </div>
                            <div className="ml-2">
                              <Search className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No results message */}
                    {showDropdown && searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3">
                        <p className="text-gray-500 text-center">No instruments found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/wishlist')}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      View My Wishlist
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Manage your saved instruments and track their performance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}