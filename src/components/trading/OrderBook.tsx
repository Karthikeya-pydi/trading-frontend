'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, Filter, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

// Updated interface to match IIFL API response structure
interface IIFLOrder {
  OrderID: string
  OrderStatus: string
  OrderType: string
  OrderSide: string
  OrderQuantity: number
  FilledQuantity: number
  RemainingQuantity: number
  LimitPrice: number
  StopPrice: number
  OrderTime: string
  OrderUniqueIdentifier: string
  ExchangeOrderID: string
  ExchangeSegment: string
  ExchangeInstrumentID: string
  ProductType: string
  TimeInForce: string
  DisclosedQuantity: number
  OrderSource: string
  OrderEntryTime: string
  LastUpdateTime: string
  OrderValidity: string
  OrderStatusText: string
  RejectionReason: string | null
  OrderLegStatus: string
  MarketType: string
}

interface OrderBookResponse {
  type: string
  result: {
    orderBook: IIFLOrder[]
    totalOrders: number
    pendingOrders: number
    filledOrders: number
    cancelledOrders: number
  }
}

export default function OrderBook() {
  const [orders, setOrders] = useState<IIFLOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterSide, setFilterSide] = useState<string>('ALL')
  const [searchSymbol, setSearchSymbol] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    filledOrders: 0,
    cancelledOrders: 0
  })

  const fetchOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to view orders')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/trading/order-book`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Log the raw response for debugging
      console.log('📊 OrderBook - Response status:', response.status)
      console.log('📊 OrderBook - Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.log('📊 OrderBook - Error response:', errorData)
        
        // Handle specific backend validation errors
        if (errorData.detail && errorData.detail.includes('order_id') && errorData.detail.includes('string_type')) {
          throw new Error('Backend validation error: order_id type mismatch. This is a known issue being resolved.')
        }
        
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to fetch orders`)
      }

      const data: OrderBookResponse = await response.json()
      console.log('📊 OrderBook - Success response data:', data)
      
      // Handle IIFL API response structure
      if (data && data.type === 'success' && data.result && Array.isArray(data.result)) {
        // The result is directly an array of orders
        console.log('📊 OrderBook - Processing orders:', data.result)
        
        // Validate and clean the orders data
        const validOrders = data.result.filter((order, index) => {
          if (!order) {
            console.warn('📊 OrderBook - Skipping null/undefined order')
            return false
          }
          
          // Log the first order structure for debugging
          if (index === 0) {
            console.log('📊 OrderBook - First order structure:', order)
            console.log('📊 OrderBook - Order keys:', Object.keys(order))
          }
          
          return true
        })
        
        setOrders(validOrders)
        // Since we don't have summary data in this response, calculate it from orders
        setSummary({
          totalOrders: validOrders.length,
          pendingOrders: validOrders.filter(o => o && (o.OrderStatus === 'NEW' || o.OrderStatus === 'PARTIALLY_FILLED')).length,
          filledOrders: validOrders.filter(o => o && o.OrderStatus === 'FILLED').length,
          cancelledOrders: validOrders.filter(o => o && o.OrderStatus === 'CANCELLED').length
        })
      } else if (data && data.type === 'success' && data.result && data.result.orderBook && Array.isArray(data.result.orderBook)) {
        // Handle the case where result.orderBook exists (original expected format)
        setOrders(data.result.orderBook)
        setSummary({
          totalOrders: data.result.totalOrders || 0,
          pendingOrders: data.result.pendingOrders || 0,
          filledOrders: data.result.filledOrders || 0,
          cancelledOrders: data.result.cancelledOrders || 0
        })
      } else {
        console.warn('📊 OrderBook - Unexpected response format:', data)
        setOrders([])
        setError('Unexpected response format from server')
      }
    } catch (err: any) {
      console.error('❌ OrderBook - Error fetching orders:', err)
      setError(err.message || 'Failed to fetch orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to cancel orders')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/trading/orders/${orderId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to cancel order')
      }

      // Refresh orders after cancellation
      await fetchOrders()
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      setError(err.message || 'Failed to cancel order')
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders based on current filters
  const filteredOrders = orders.filter(order => {
    if (!order) return false
    
    const matchesStatus = filterStatus === 'ALL' || order.OrderStatus === filterStatus
    const matchesSide = filterSide === 'ALL' || order.OrderSide === filterSide
    const matchesSymbol = !searchSymbol || 
      (order.ExchangeInstrumentID && order.ExchangeInstrumentID.toLowerCase().includes(searchSymbol.toLowerCase()))
    
    return matchesStatus && matchesSide && matchesSymbol
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PARTIALLY_FILLED':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FILLED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-600" />
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PARTIALLY_FILLED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FILLED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  const getProductTypeLabel = (productType: string) => {
    switch (productType) {
      case 'CNC': return 'Cash & Carry'
      case 'MIS': return 'Intraday'
      case 'NRML': return 'Normal'
      default: return productType
    }
  }

  const getOrderTypeLabel = (orderType: string) => {
    switch (orderType) {
      case 'MARKET': return 'Market'
      case 'LIMIT': return 'Limit'
      case 'SL-M': return 'Stop Loss Market'
      case 'SL-L': return 'Stop Loss Limit'
      default: return orderType
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Order Book</h3>
          <Badge variant="outline">{filteredOrders.length} orders</Badge>
        </div>
        <Button
          onClick={refreshOrders}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
                  <SelectItem value="FILLED">Filled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* Symbol Search */}
            <div className="space-y-2">
              <Label htmlFor="symbol-search">Search Instrument ID</Label>
              <Input
                id="symbol-search"
                placeholder="Enter instrument ID..."
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
                    Your orders may have been placed successfully with IIFL, but the backend 
                    response validation is failing due to a type mismatch.
                  </p>
                  <div className="mt-2 text-xs text-red-600">
                    <strong>Technical Details:</strong> Backend expects order_id as string, 
                    but IIFL API returns integer. This will be fixed shortly.
                  </div>
                  <div className="mt-3 text-xs text-red-600">
                    <strong>What to do:</strong> Check your IIFL account directly or contact support to confirm order status.
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {orders.length === 0 ? (
              <div>
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No orders found</p>
                <p className="text-sm">Start trading to see your orders here</p>
              </div>
            ) : (
              <div>
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No orders match the current filters</p>
                <p className="text-sm">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            <Card key={`${order.OrderID || order.ExchangeOrderID || order.OrderUniqueIdentifier || `order-${index}`}-${order.ExchangeInstrumentID || 'unknown'}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-semibold text-lg">{order.ExchangeInstrumentID || 'Unknown'}</div>
                      <Badge className={getSideColor(order.OrderSide)}>
                        {order.OrderSide}
                      </Badge>
                      <Badge className={getStatusColor(order.OrderStatus)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.OrderStatus)}
                          <span>{order.OrderStatusText || order.OrderStatus}</span>
                        </div>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getProductTypeLabel(order.ProductType)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <div className="font-medium">
                          {order.OrderQuantity?.toLocaleString() || '0'}
                          {order.FilledQuantity > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({order.FilledQuantity} filled, {order.RemainingQuantity || 0} pending)
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <div className="font-medium">
                          {order.LimitPrice > 0 ? `₹${order.LimitPrice.toFixed(2)}` : 'Market'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Value:</span>
                        <div className="font-medium">
                          ₹{((order.OrderQuantity || 0) * (order.LimitPrice || 0)).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Order Type:</span>
                        <div className="font-medium">{getOrderTypeLabel(order.OrderType)}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <div>
                        <strong>Order ID:</strong> {order.OrderID || 'N/A'} • 
                        <strong>Exchange ID:</strong> {order.ExchangeOrderID || 'N/A'} • 
                        <strong>Segment:</strong> {order.ExchangeSegment || 'N/A'}
                      </div>
                      <div>
                        <strong>Entry Time:</strong> {order.OrderEntryTime ? formatDate(order.OrderEntryTime) : 'N/A'} • 
                        <strong>Last Update:</strong> {order.LastUpdateTime ? formatDate(order.LastUpdateTime) : 'N/A'}
                      </div>
                      {order.RejectionReason && (
                        <div className="text-red-600">
                          <strong>Rejection Reason:</strong> {order.RejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {(order.OrderStatus === 'NEW' || order.OrderStatus === 'PARTIALLY_FILLED') && (
                      <Button
                        onClick={() => cancelOrder(order.OrderID || order.ExchangeOrderID || order.OrderUniqueIdentifier || '')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={!order.OrderID && !order.ExchangeOrderID && !order.OrderUniqueIdentifier}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {orders.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.pendingOrders}
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.filledOrders}
                </div>
                <div className="text-gray-600">Filled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {summary.cancelledOrders}
                </div>
                <div className="text-gray-600">Cancelled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.OrderStatus === 'REJECTED').length}
                </div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
