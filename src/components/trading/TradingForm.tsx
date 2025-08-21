'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, Calculator, Info } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

interface TradingFormProps {
  selectedStock: any
  onOrderPlaced: () => void
}

interface OrderRequest {
  stock_symbol: string
  quantity: number
  price?: number
  order_type: 'BUY' | 'SELL'
}

interface OrderResponse {
  status: string
  message: string
  order_id: string | number  // Allow both string and number types
  trade_id: number
  stock_info: any
  order_details: any
  timestamp: string
}

export default function TradingForm({ selectedStock, onOrderPlaced }: TradingFormProps) {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [isMarketOrder, setIsMarketOrder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [orderSummary, setOrderSummary] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastOrderData, setLastOrderData] = useState<any>(null)

  // Reset form when stock changes
  useEffect(() => {
    if (selectedStock) {
      setPrice(selectedStock.current_price?.toString() || '')
      setQuantity('')
      setError('')
      setSuccess('')
      setOrderSummary(null)
      setRetryCount(0)
      setLastOrderData(null)
    }
  }, [selectedStock])

  // Calculate order summary
  const calculateOrderSummary = useCallback(() => {
    if (selectedStock && quantity && (isMarketOrder || price)) {
      const qty = parseInt(quantity) || 0
      const priceValue = isMarketOrder ? (selectedStock.current_price || 0) : (parseFloat(price) || 0)
      const totalValue = qty * priceValue

      setOrderSummary({
        quantity: qty,
        price: priceValue,
        totalValue,
        netAmount: totalValue
      })
    } else {
      setOrderSummary(null)
    }
  }, [selectedStock, quantity, price, isMarketOrder])

  useEffect(() => {
    calculateOrderSummary()
  }, [calculateOrderSummary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStock) {
      setError('Please select a stock first')
      return
    }

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (!isMarketOrder && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to place orders')
        return
      }

      const orderData: OrderRequest = {
        stock_symbol: selectedStock.symbol,
        quantity: parseInt(quantity),
        order_type: orderType,
        ...(isMarketOrder ? {} : { price: parseFloat(price) })
      }

      // Store order data for potential retry
      setLastOrderData(orderData)

      const response = await fetch(`${API_BASE_URL}/api/trading/buy-stock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check if this is the specific backend validation error
        if (errorData.detail && errorData.detail.includes('order_id') && errorData.detail.includes('string_type')) {
          throw new Error('Backend validation error: order_id type mismatch. This is a known issue being resolved by the backend team.')
        }
        
        throw new Error(errorData.detail || 'Failed to place order')
      }

      const data: OrderResponse = await response.json()
      
      // Log the response for debugging
      console.log('📊 TradingForm - Order response data:', data)
      console.log('📊 TradingForm - Order ID type:', typeof data.order_id, 'Value:', data.order_id)
      
      // Validate response structure
      if (!data || typeof data.status !== 'string') {
        throw new Error('Invalid response format from server')
      }
      
      if (data.status === 'success') {
        // Ensure order_id is properly handled regardless of type
        const orderId = typeof data.order_id === 'number' ? data.order_id.toString() : data.order_id
        console.log('✅ TradingForm - Order placed successfully with ID:', orderId, 'Type:', typeof orderId)
        
        setSuccess(data.message || 'Order placed successfully!')
        setOrderSummary(null)
        // Reset form
        setQuantity('')
        setPrice(selectedStock.current_price?.toString() || '')
        // Notify parent component
        onOrderPlaced()
      } else {
        setError(data.message || 'Order placement failed')
      }
    } catch (err: any) {
      console.error('Error placing order:', err)
      setError(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      setQuantity(value)
    }
  }

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      setPrice(value)
    }
  }

  const handleRetry = async () => {
    if (lastOrderData && retryCount < 3) {
      setRetryCount(prev => prev + 1)
      setError('')
      setLoading(true)
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/trading/buy-stock`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lastOrderData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes('order_id') && errorData.detail.includes('string_type')) {
            throw new Error('Backend validation error still persists. Please try again later or contact support.')
          }
          throw new Error(errorData.detail || 'Retry failed')
        }

        const data: OrderResponse = await response.json()
        
        if (data.status === 'success') {
          const orderId = typeof data.order_id === 'number' ? data.order_id.toString() : data.order_id
          setSuccess(`Order placed successfully! (Retry #${retryCount + 1})`)
          setOrderSummary(null)
          setQuantity('')
          setPrice(selectedStock.current_price?.toString() || '')
          onOrderPlaced()
        } else {
          setError(data.message || 'Retry failed')
        }
      } catch (err: any) {
        console.error('Retry error:', err)
        setError(err.message || 'Retry failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const getOrderTypeColor = () => {
    return orderType === 'BUY' ? 'text-green-600' : 'text-red-600'
  }

  const getOrderTypeBgColor = () => {
    return orderType === 'BUY' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  if (!selectedStock) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Select a stock from the search above to start trading</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800">System Status: Partial Service</h4>
            <p className="text-xs text-yellow-700 mt-1">
              Trading functionality is available, but you may encounter backend validation errors. 
              The backend team is actively resolving this issue.
            </p>
          </div>
          <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
            Issue #BE-001
          </div>
        </div>
      </div>

      {/* Stock Info Header */}
      <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
        <CardContent className={`p-4 ${getOrderTypeBgColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedStock.symbol}</h3>
              <p className="text-sm text-gray-600">{selectedStock.name}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ₹{selectedStock.current_price?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                {selectedStock.exchange_segment === 1 ? 'NSE' : 'BSE'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={orderType === 'BUY' ? 'default' : 'outline'}
            className={`h-12 ${orderType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setOrderType('BUY')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            BUY
          </Button>
          <Button
            type="button"
            variant={orderType === 'SELL' ? 'default' : 'outline'}
            className={`h-12 ${orderType === 'SELL' ? 'bg-red-600 hover:bg-red-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setOrderType('SELL')}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            SELL
          </Button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            min="1"
            step={selectedStock.lot_size || 1}
            required
            className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
          />
          <div className="text-xs text-gray-500">
            Lot Size: {selectedStock.lot_size || 1} • 
            Min: {selectedStock.lot_size || 1}
          </div>
        </div>

        {/* Price Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="marketOrder"
              checked={isMarketOrder}
              onChange={(e) => setIsMarketOrder(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <Label htmlFor="marketOrder">Market Order</Label>
          </div>
          
          {!isMarketOrder && (
            <>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                min="0.01"
                step={selectedStock.tick_size || 0.01}
                required
                className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
              <div className="text-xs text-gray-500">
                Tick Size: ₹{selectedStock.tick_size || 0.01}
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        {orderSummary && (
          <Card className="bg-gray-50 border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-gray-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{orderSummary.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <span>₹{orderSummary.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span>₹{orderSummary.totalValue.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Net Amount:</span>
                <span>₹{orderSummary.netAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

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
                      Your order may have been placed successfully with IIFL, but the backend 
                      response validation is failing due to a type mismatch.
                    </p>
                    <div className="mt-2 text-xs text-red-600">
                      <strong>Technical Details:</strong> Backend expects order_id as string, 
                      but IIFL API returns integer. This will be fixed shortly.
                    </div>
                    {lastOrderData && retryCount < 3 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Button
                          onClick={handleRetry}
                          disabled={loading}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? 'Retrying...' : `Retry (${retryCount + 1}/3)`}
                        </Button>
                        <span className="text-xs text-red-600">
                          Retry attempts: {retryCount}/3
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className={`w-full h-12 text-lg font-semibold ${
            orderType === 'BUY' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
          disabled={loading || !selectedStock || !quantity}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            `${orderType} ${selectedStock?.symbol || 'Stock'}`
          )}
        </Button>
      </form>

      {/* Important Notes */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>⚠️ Market orders execute at current market price</p>
        <p>⚠️ All orders are subject to market conditions and availability</p>
      </div>

      {/* Backend Issue Guidance */}
      <Card className="bg-blue-50 border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 mb-2">If You Encounter an Error</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Don't worry</strong> - this is a known backend issue being resolved</p>
                <p>• <strong>Your order may have been placed</strong> successfully with IIFL</p>
                <p>• <strong>Check your order book</strong> to confirm order status</p>
                <p>• <strong>Contact support</strong> if you need immediate assistance</p>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Button 
                  onClick={() => window.open('/trading?tab=orders', '_blank')}
                  variant="outline"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-800 border-blue-300"
                >
                  View Order Book →
                </Button>
                <span className="text-blue-400">|</span>
                <Button 
                  onClick={() => window.open('/support', '_blank')}
                  variant="outline"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-800 border-blue-300"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-gray-500 mt-4">
        <p>📊 Order will be placed with IIFL Interactive</p>
        <p>⏰ Orders are valid for the current trading session</p>
      </div>
    </div>
  )
}
