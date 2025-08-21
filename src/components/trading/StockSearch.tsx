'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

interface StockSearchProps {
  onStockSelect: (stock: any) => void
}

interface StockResult {
  symbol: string
  name: string
  exchange_segment: number
  instrument_id: number
  series: string
  isin: string
  lot_size: number
  tick_size: number
  current_price: number
  market_data?: any
}

interface SearchResponse {
  type: string
  query: string
  total_found: number
  returned: number
  results: StockResult[]
  message: string
}

export default function StockSearch({ onStockSelect }: StockSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)

  const searchStocks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to search stocks')
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/trading/search-stocks?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to search stocks')
      }

      const data: SearchResponse = await response.json()
      
      if (data.type === 'success') {
        setResults(data.results || [])
        setShowResults(true)
      } else {
        setError(data.message || 'No stocks found')
        setResults([])
      }
    } catch (err: any) {
      console.error('Error searching stocks:', err)
      setError(err.message || 'Failed to search stocks')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchStocks(query)
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchStocks])

  const handleStockSelect = (stock: StockResult) => {
    onStockSelect(stock)
    setShowResults(false)
    setQuery(stock.symbol)
  }

  const getPriceChangeColor = (stock: StockResult) => {
    if (!stock.market_data) return 'text-gray-600'
    // You can add logic here to determine if price went up/down
    return 'text-gray-600'
  }

  const getExchangeName = (segment: number) => {
    return segment === 1 ? 'NSE' : 'BSE'
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search stocks by name, symbol, or ISIN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-3 text-base"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-gray-200">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {results.map((stock, index) => (
                <div
                  key={`${stock.symbol}-${index}`}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleStockSelect(stock)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold text-gray-900">
                          {stock.symbol}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getExchangeName(stock.exchange_segment)}
                        </Badge>
                        {stock.series !== 'EQ' && (
                          <Badge variant="secondary" className="text-xs">
                            {stock.series}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {stock.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ISIN: {stock.isin} • Lot: {stock.lot_size}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getPriceChangeColor(stock)}`}>
                        ₹{stock.current_price?.toFixed(2) || 'N/A'}
                      </div>
                      {stock.market_data && (
                        <div className="text-xs text-gray-500 mt-1">
                          {/* Add price change indicators here if available */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && query.trim() && results.length === 0 && !loading && !error && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-gray-200">
          <CardContent className="p-4 text-center text-gray-500">
            No stocks found matching "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  )
}

