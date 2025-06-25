"use client"

import { useState, useEffect, useCallback } from "react"
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
  Briefcase
} from "lucide-react"

// Types for API responses
interface Position {
  symbol: string
  quantity: number
  avg_price: number
  ltp: number
  pnl: number
  pnl_percent: number
  position_id: string
}

interface Trade {
  trade_id: string
  symbol: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
  timestamp: string
}

interface Order {
  order_id: string
  symbol: string
  quantity: number
  price: number
  order_type: string
  status: string
  side: 'BUY' | 'SELL'
  created_at: string
}

interface MarketData {
  symbol: string
  ltp: number
  change: number
  change_percent: number
  volume: number
}

// Portfolio/Holdings types
interface Holding {
  stock_name: string
  isin: string
  quantity: number
  average_price: number
  investment_value: number
  purchase_date: string
  is_collateral: boolean
  current_price?: number
  current_value?: number
  unrealized_pnl?: number
  unrealized_pnl_percent?: number
}

interface PortfolioSummary {
  total_holdings: number
  total_investment: number
  total_current_value: number
  unrealized_pnl: number
  unrealized_pnl_percent?: number
  holdings: Holding[]
}

interface PnLData {
  total_realized_pnl: number
  total_unrealized_pnl: number
  total_pnl: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_charges: number
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState("portfolio")
  const [mounted, setMounted] = useState(false)
  
  // Data states
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  
  // Portfolio/Holdings states
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    symbol: "",
    quantity: "",
    price: "",
    order_type: "LIMIT",
    side: "BUY"
  })
  
  // Market data form state
  const [marketSymbols, setMarketSymbols] = useState("")
  const [ltpSymbol, setLtpSymbol] = useState("")
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const verifyApiCredentials = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })
      
      if (response.ok) {
        const user = await response.json()
        
        // Check if user has either market or interactive credentials
        const hasCredentials = user.has_iifl_market_credentials || user.has_iifl_interactive_credentials
        
        if (!hasCredentials) {
          console.log('No API credentials found, redirecting to setup')
          window.location.href = "/setup"
          return
        }
        console.log('API credentials verified, loading dashboard')
        
        // Load initial data
        loadAllData()
      } else {
        console.log('Could not verify credentials, assuming setup needed')
        window.location.href = "/setup"
      }
    } catch (_error) {
      console.error('Error verifying credentials:', _error)
      // Continue loading dashboard as fallback
    }
  }, [])

  // Check if user is authenticated and has credentials
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('No token found, redirecting to login')
      window.location.href = "/login"
      return
    }
    console.log('User authenticated, verifying API credentials')
    verifyApiCredentials()
  }, [verifyApiCredentials])

  const apiCall = async (endpoint: string, method: string = 'GET', body?: object) => {
    const token = localStorage.getItem('token')
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
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
      // Load portfolio summary (holdings)
      const holdingsData = await apiCall('/api/portfolio/holdings-summary')
      setPortfolioSummary(holdingsData.summary)
      
      // Load P&L data
      const pnlData = await apiCall('/api/portfolio/pnl')
      setPnlData(pnlData)
    } catch (_error) {
      console.error('Error loading portfolio data:', _error)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const updatePortfolioPrices = async () => {
    setPortfolioLoading(true)
    try {
      await apiCall('/api/portfolio/update-prices', 'POST')
      setSuccess('Portfolio prices updated successfully!')
      loadPortfolioData() // Reload after update
    } catch (_error) {
      setError('Failed to update portfolio prices')
    } finally {
      setPortfolioLoading(false)
    }
  }

  const loadPositions = async () => {
    try {
      const data = await apiCall('/api/trading/positions')
      setPositions(data.positions || [])
    } catch (_error) {
      console.error('Error loading positions:', _error)
    }
  }

  const loadTrades = async () => {
    try {
      const data = await apiCall('/api/trading/trades')
      setTrades(data.trades || [])
    } catch (_error) {
      console.error('Error loading trades:', _error)
    }
  }

  const loadOrderBook = async () => {
    try {
      const data = await apiCall('/api/trading/order-book')
      setOrders(data.orders || [])
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
        symbol: orderForm.symbol.toUpperCase(),
        quantity: parseInt(orderForm.quantity),
        price: parseFloat(orderForm.price),
        order_type: orderForm.order_type,
        side: orderForm.side
      }

      await apiCall('/api/trading/place-order', 'POST', orderData)
      
      setSuccess('Order placed successfully!')
      setOrderForm({
        symbol: "",
        quantity: "",
        price: "",
        order_type: "LIMIT",
        side: "BUY"
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
      await apiCall(`/api/trading/orders/${orderId}/cancel`, 'PUT')
      setSuccess('Order cancelled successfully!')
      loadOrderBook()
    } catch (_error) {
      setError('Failed to cancel order')
    }
  }

  const squareOffPosition = async (positionId: string) => {
    try {
      await apiCall(`/api/trading/positions/${positionId}/square-off`, 'POST')
      setSuccess('Position squared off successfully!')
      loadPositions()
    } catch (_error) {
      setError('Failed to square off position')
    }
  }

  const getMarketData = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const symbols = marketSymbols.split(',').map(s => s.trim().toUpperCase())
      const data = await apiCall('/api/market/market-data', 'POST', { symbols })
      setMarketData(data.market_data || [])
    } catch (_error) {
      setError('Failed to get market data')
    } finally {
      setIsLoading(false)
    }
  }

  const getLTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = await apiCall('/api/market/ltp', 'POST', { symbol: ltpSymbol.toUpperCase() })
      setSuccess(`LTP for ${ltpSymbol.toUpperCase()}: ₹${data.ltp}`)
    } catch (_error) {
      setError('Failed to get LTP')
    } finally {
      setIsLoading(false)
    }
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="place-order">Place Order</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
          </TabsList>



          {/* Portfolio Tab - NEW */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Portfolio & Holdings</h2>
              <Button
                onClick={updatePortfolioPrices}
                disabled={portfolioLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${portfolioLoading ? "animate-spin" : ""}`} />
                Update Prices
              </Button>
            </div>

            {/* Portfolio Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioSummary?.total_holdings || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Investment Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{portfolioSummary?.total_investment.toLocaleString() || '0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Unrealized P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(portfolioSummary?.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{portfolioSummary?.unrealized_pnl.toLocaleString() || '0'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pnlData?.total_trades || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {pnlData?.winning_trades || 0} wins, {pnlData?.losing_trades || 0} losses
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Holdings Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span>Your Holdings</span>
                </CardTitle>
                <CardDescription>Long-term equity holdings from IIFL</CardDescription>
              </CardHeader>
              <CardContent>
                {!portfolioSummary || portfolioSummary.holdings.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No holdings found</p>
                    <p className="text-sm text-gray-400">Your IIFL equity holdings will appear here</p>
                  </div>
                ) : (
                                     <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="border-b">
                           <th className="text-left p-3">Stock Name</th>
                           <th className="text-left p-3">Quantity</th>
                           <th className="text-left p-3">Avg Price</th>
                           <th className="text-left p-3">Current Price</th>
                           <th className="text-left p-3">Investment</th>
                           <th className="text-left p-3">Current Value</th>
                           <th className="text-left p-3">P&L</th>
                           <th className="text-left p-3">Type</th>
                         </tr>
                       </thead>
                       <tbody>
                         {portfolioSummary.holdings.map((holding) => (
                           <tr key={holding.isin} className="border-b hover:bg-gray-50">
                             <td className="p-3">
                               <div>
                                 <div className="font-medium">{holding.stock_name}</div>
                                 <div className="text-sm text-gray-500">{holding.isin}</div>
                               </div>
                             </td>
                             <td className="p-3 font-medium">{holding.quantity}</td>
                             <td className="p-3">₹{holding.average_price.toFixed(2)}</td>
                             <td className="p-3 font-medium">
                               ₹{holding.current_price?.toFixed(2) || holding.average_price.toFixed(2)}
                             </td>
                             <td className="p-3">₹{holding.investment_value.toLocaleString()}</td>
                             <td className="p-3 font-medium">
                               ₹{holding.current_value?.toLocaleString() || holding.investment_value.toLocaleString()}
                             </td>
                             <td className="p-3">
                               <div className={`font-medium ${(holding.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 ₹{holding.unrealized_pnl?.toFixed(2) || '0.00'}
                               </div>
                               <div className={`text-sm ${(holding.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 ({holding.unrealized_pnl_percent?.toFixed(2) || '0.00'}%)
                               </div>
                             </td>
                             <td className="p-3">
                               <Badge variant={holding.is_collateral ? "secondary" : "outline"}>
                                 {holding.is_collateral ? "Collateral" : "Regular"}
                               </Badge>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                )}
              </CardContent>
            </Card>

            {/* P&L Summary */}
            {pnlData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-green-600" />
                    <span>P&L Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Realized P&L:</span>
                        <span className={`font-medium ${pnlData.total_realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{pnlData.total_realized_pnl.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unrealized P&L:</span>
                        <span className={`font-medium ${pnlData.total_unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{pnlData.total_unrealized_pnl.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total P&L:</span>
                        <span className={`font-bold ${pnlData.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{pnlData.total_pnl.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Trades:</span>
                        <span className="font-medium">{pnlData.total_trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Winning Trades:</span>
                        <span className="font-medium text-green-600">{pnlData.winning_trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="font-medium">{pnlData.win_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Place Order Tab */}
          <TabsContent value="place-order" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span>Place New Order</span>
                </CardTitle>
                <CardDescription>Enter order details to place a trade</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={placeOrder} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., RELIANCE, TCS"
                        value={orderForm.symbol}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, symbol: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Number of shares"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="Price per share"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_type">Order Type</Label>
                      <select
                        id="order_type"
                        className="w-full p-2 border rounded-md"
                        value={orderForm.order_type}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value }))}
                      >
                        <option value="LIMIT">LIMIT</option>
                        <option value="MARKET">MARKET</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="side">Side</Label>
                      <select
                        id="side"
                        className="w-full p-2 border rounded-md"
                        value={orderForm.side}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, side: e.target.value }))}
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
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

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Current Positions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No positions found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Symbol</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Avg Price</th>
                          <th className="text-left p-2">LTP</th>
                          <th className="text-left p-2">P&L</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position) => (
                          <tr key={position.position_id} className="border-b">
                            <td className="p-2 font-medium">{position.symbol}</td>
                            <td className="p-2">{position.quantity}</td>
                            <td className="p-2">₹{position.avg_price}</td>
                            <td className="p-2">₹{position.ltp}</td>
                            <td className={`p-2 ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{position.pnl} ({position.pnl_percent}%)
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => squareOffPosition(position.position_id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Square Off
                              </Button>
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

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
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
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelOrder(order.order_id)}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
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
              {/* Market Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Market Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={getMarketData} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbols">Symbols (comma-separated)</Label>
                      <Input
                        id="symbols"
                        placeholder="e.g., RELIANCE, TCS, INFY"
                        value={marketSymbols}
                        onChange={(e) => setMarketSymbols(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      Get Market Data
                    </Button>
                  </form>

                  {marketData.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {marketData.map((data) => (
                        <div key={data.symbol} className="flex justify-between items-center p-2 border rounded">
                          <span className="font-medium">{data.symbol}</span>
                          <div className="text-right">
                            <div>₹{data.ltp}</div>
                            <div className={`text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {data.change >= 0 ? '+' : ''}{data.change} ({data.change_percent}%)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LTP */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Last Traded Price</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={getLTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ltp-symbol">Symbol</Label>
                      <Input
                        id="ltp-symbol"
                        placeholder="e.g., RELIANCE"
                        value={ltpSymbol}
                        onChange={(e) => setLtpSymbol(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      Get LTP
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}