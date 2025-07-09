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
  
  // Order book filtering state
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL")
  const [orderSideFilter, setOrderSideFilter] = useState("ALL")
  
  // Order details modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-refresh order book every 30 seconds
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      loadOrderBook()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [mounted])

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

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'FILLED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PARTIALLY_FILLED':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Filter orders based on search query and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.symbol.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                         order.order_id.toLowerCase().includes(orderSearchQuery.toLowerCase())
    const matchesStatus = orderStatusFilter === "ALL" || order.status === orderStatusFilter
    const matchesSide = orderSideFilter === "ALL" || order.side === orderSideFilter
    
    return matchesSearch && matchesStatus && matchesSide
  })

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
                <CardDescription>Manage your active and pending orders</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <Label htmlFor="order-search" className="text-sm font-medium text-gray-700 mb-2 block">
                        Search Orders
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="order-search"
                          placeholder="Search by symbol or order ID..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                      <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                        Status
                      </Label>
                      <select
                        id="status-filter"
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="FILLED">Filled</option>
                        <option value="PARTIALLY_FILLED">Partially Filled</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    
                    {/* Side Filter */}
                    <div className="w-full md:w-32">
                      <Label htmlFor="side-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                        Side
                      </Label>
                      <select
                        id="side-filter"
                        value={orderSideFilter}
                        onChange={(e) => setOrderSideFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ALL">All</option>
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                    {(orderSearchQuery || orderStatusFilter !== "ALL" || orderSideFilter !== "ALL") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrderSearchQuery("")
                          setOrderStatusFilter("ALL")
                          setOrderSideFilter("ALL")
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No active orders</p>
                    <p className="text-gray-400 text-sm">Orders you place will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold text-gray-700">Symbol</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Side</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Quantity</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Price</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Time</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order, index) => (
                          <tr key={order.order_id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="p-3 font-medium text-gray-900 cursor-pointer hover:text-blue-600" 
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderModal(true)
                                }}>
                              {order.symbol}
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={order.side === 'BUY' ? 'default' : 'secondary'}
                                className={order.side === 'BUY' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                              >
                                {order.side}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-700">{order.quantity}</td>
                            <td className="p-3 text-gray-700">
                              {order.order_type === 'MARKET' ? 'MARKET' : `₹${order.price}`}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {order.order_type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant="outline"
                                className={getStatusBadgeClass(order.status)}
                              >
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleString()}
                            </td>
                            <td className="p-3">
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
      
      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                  <p className="text-sm text-gray-900 font-mono">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Symbol</Label>
                  <p className="text-sm text-gray-900 font-medium">{selectedOrder.symbol}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Side</Label>
                  <Badge 
                    variant={selectedOrder.side === 'BUY' ? 'default' : 'secondary'}
                    className={selectedOrder.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {selectedOrder.side}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                  <p className="text-sm text-gray-900">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Price</Label>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.order_type === 'MARKET' ? 'MARKET' : `₹${selectedOrder.price}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Type</Label>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {selectedOrder.order_type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge 
                    variant="outline"
                    className={getStatusBadgeClass(selectedOrder.status)}
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created At</Label>
                  <p className="text-sm text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedOrder.status === 'PENDING' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      cancelOrder(selectedOrder.order_id)
                      setShowOrderModal(false)
                    }}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}