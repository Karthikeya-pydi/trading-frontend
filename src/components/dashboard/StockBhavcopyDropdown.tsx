"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Calendar, Users, Package, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BhavcopyRecord } from "@/types"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

interface StockBhavcopyDropdownProps {
  stockSymbol: string
  stockName: string
  isExpanded: boolean
  onToggle: () => void
}

export function StockBhavcopyDropdown({
  stockSymbol,
  stockName,
  isExpanded,
  onToggle
}: StockBhavcopyDropdownProps) {
  const [bhavcopyData, setBhavcopyData] = useState<BhavcopyRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Fetch bhavcopy data for this specific stock
  const fetchBhavcopyData = async () => {
    if (!isExpanded || bhavcopyData) return // Don't fetch if already loaded
    
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Search for the stock in bhavcopy data
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BHAVCOPY_DATA}`, {
        headers
      })

      const data = await response.json()

      if (response.ok && data.data) {
        // Find the specific stock
        const stockData = data.data.find((record: BhavcopyRecord) => 
          record.SYMBOL.toLowerCase() === stockSymbol.toLowerCase()
        )
        
        if (stockData) {
          setBhavcopyData(stockData)
        } else {
          setError("Stock data not found in bhavcopy")
        }
      } else {
        setError(data.message || "Failed to fetch bhavcopy data")
      }
    } catch (err) {
      console.error('Error fetching bhavcopy data:', err)
      setError(`Failed to fetch bhavcopy data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchBhavcopyData()
    }
  }, [isExpanded])

  const formatNumber = (value: number | string) => {
    if (typeof value === 'string') return value
    return value.toLocaleString()
  }

  const formatPercentage = (value: number | string) => {
    if (typeof value === 'string') return value
    return `${value.toFixed(2)}%`
  }

  const getPriceChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPriceChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3" />
    if (current < previous) return <TrendingDown className="h-3 w-3" />
    return null
  }

  return (
    <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full justify-between text-sm text-gray-700 hover:text-gray-900 hover:bg-blue-50 rounded-none border-b border-gray-100 transition-all duration-200"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="font-medium">Market Data for {stockName}</span>
          <Badge variant="outline" className="text-xs ml-2">
            Bhavcopy
          </Badge>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-white">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">Fetching latest market data...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6 bg-red-50 rounded-lg border border-red-200">
              <Info className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchBhavcopyData}
                className="mt-3 border-red-300 text-red-600 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}

          {bhavcopyData && (
            <>
              {/* Quick Summary Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Market Summary for {bhavcopyData.SYMBOL}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(bhavcopyData.CLOSE_PRICE)}
                    </div>
                    <p className="text-xs text-gray-600">Current Price</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                      getPriceChangeColor(bhavcopyData.CLOSE_PRICE, bhavcopyData.PREV_CLOSE)
                    }`}>
                      {getPriceChangeIcon(bhavcopyData.CLOSE_PRICE, bhavcopyData.PREV_CLOSE)}
                      {formatCurrency(Math.abs(bhavcopyData.CLOSE_PRICE - bhavcopyData.PREV_CLOSE))}
                    </div>
                    <p className="text-xs text-gray-600">Price Change</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(bhavcopyData.TTL_TRD_QNTY)}
                    </div>
                    <p className="text-xs text-gray-600">Volume</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercentage(bhavcopyData.DELIV_PER)}
                    </div>
                    <p className="text-xs text-gray-600">Delivery %</p>
                  </div>
                </div>
              </div>

              {/* Detailed Data Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Price Information */}
                <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-200 hover:ring-blue-300 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Price Information</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Open:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(bhavcopyData.OPEN_PRICE)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">High:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(bhavcopyData.HIGH_PRICE)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Low:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(bhavcopyData.LOW_PRICE)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Close:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(bhavcopyData.CLOSE_PRICE)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Prev Close:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(bhavcopyData.PREV_CLOSE)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Statistics */}
                <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-200 hover:ring-blue-300 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Trading Statistics</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Volume:</span>
                        <span className="font-semibold text-gray-900">{formatNumber(bhavcopyData.TTL_TRD_QNTY)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Turnover:</span>
                        <span className="font-semibold text-gray-900">{formatNumber(bhavcopyData.TURNOVER_LACS)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Trades:</span>
                        <span className="font-semibold text-gray-900">{formatNumber(bhavcopyData.NO_OF_TRADES)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Price:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(bhavcopyData.AVG_PRICE)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-200 hover:ring-blue-300 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Delivery Info</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Delivery Qty:</span>
                        <span className="font-semibold text-gray-900">{formatNumber(bhavcopyData.DELIV_QTY)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Delivery %:</span>
                        <span className="font-semibold text-gray-900">{formatPercentage(bhavcopyData.DELIV_PER)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Series:</span>
                        <Badge variant="outline" className="text-xs font-medium">
                          {bhavcopyData.SERIES}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {new Date(bhavcopyData.DATE1).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 text-center">
                  Data source: Bhavcopy • Last updated: {new Date(bhavcopyData.DATE1).toLocaleDateString()} • 
                  Series: {bhavcopyData.SERIES} • Symbol: {bhavcopyData.SYMBOL}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
