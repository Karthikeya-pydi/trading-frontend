'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { OptionChain, OptionChainItem, OptionData } from '@/types/strategy-builder'
import { useMarketDataWebSocket } from '@/hooks/useMarketDataWebSocket'

interface OptionChainTableProps {
  optionChain: OptionChain
  onOptionSelect?: (option: OptionData, strike: number, optionType: 'CE' | 'PE') => void
  selectedOptions?: Set<string>
  spotPrice?: number
}

export function OptionChainTable({
  optionChain,
  onOptionSelect,
  selectedOptions = new Set(),
  spotPrice,
}: OptionChainTableProps) {
  const [searchStrike, setSearchStrike] = useState('')
  const [underlyingSpotPrice, setUnderlyingSpotPrice] = useState<number | null>(null)

  // Subscribe to underlying stock for spot price updates
  useMarketDataWebSocket({
    stocks: [optionChain.underlying],
    onMarketData: (data) => {
      if (data.stock_name === optionChain.underlying && data.LTP) {
        setUnderlyingSpotPrice(data.LTP)
      }
    },
  })

  // Filter strikes based on search
  const filteredChain = useMemo(() => {
    const chain = Array.isArray(optionChain.option_chain) ? optionChain.option_chain : []
    if (!searchStrike) return chain

    const searchNum = parseFloat(searchStrike)
    if (isNaN(searchNum)) return chain

    return chain.filter((item) => {
      const diff = Math.abs(item.strike - searchNum)
      return diff < 100 // Show strikes within 100 points
    })
  }, [optionChain.option_chain, searchStrike])

  // Find ATM strike
  const atmStrike = useMemo(() => {
    if (!spotPrice) return null
    const chain = Array.isArray(optionChain.option_chain) ? optionChain.option_chain : []
    if (chain.length === 0) return null
    return chain.reduce((closest, item) => {
      const closestDiff = Math.abs(closest.strike - spotPrice)
      const currentDiff = Math.abs(item.strike - spotPrice)
      return currentDiff < closestDiff ? item : closest
    }).strike
  }, [optionChain.option_chain, spotPrice])

  const getOptionKey = (strike: number, optionType: 'CE' | 'PE') => {
    return `${strike}-${optionType}`
  }

  const isSelected = (strike: number, optionType: 'CE' | 'PE') => {
    return selectedOptions.has(getOptionKey(strike, optionType))
  }

  const getOptionDisplay = (option: OptionData | undefined, strike: number, type: 'CE' | 'PE') => {
    if (!option) return null

    const currentPrice = option.LTP || 0
    const change = option.Change || 0
    const changePercent = option.ChangePercent || 0
    const isSelectedOption = isSelected(strike, type)

    return (
      <div
        className={`p-2 rounded-lg cursor-pointer transition-all ${
          isSelectedOption
            ? 'bg-teal-100 border-2 border-teal-500'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
        onClick={() => onOptionSelect?.(option, strike, type)}
      >
        <div className="text-xs font-semibold text-gray-600 mb-1">{type}</div>
        <div className="text-sm font-bold text-gray-900">
          {currentPrice > 0 ? `₹${currentPrice.toFixed(2)}` : 'N/A'}
        </div>
        {change !== 0 && (
          <div
            className={`text-xs flex items-center gap-1 mt-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
        {option.Bid && option.Ask && (
          <div className="text-xs text-gray-500 mt-1">
            B: ₹{option.Bid.toFixed(2)} | A: ₹{option.Ask.toFixed(2)}
          </div>
        )}
        {option.OpenInterest !== undefined && (
          <div className="text-xs text-gray-500 mt-1">OI: {option.OpenInterest.toLocaleString()}</div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Option Chain</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {optionChain.underlying} • Spot: ₹
              {underlyingSpotPrice?.toFixed(2) ||
                spotPrice?.toFixed(2) ||
                optionChain.spot_price.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                placeholder="Search strike..."
                value={searchStrike}
                onChange={(e) => setSearchStrike(e.target.value)}
                className="pl-8 w-40"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 text-xs font-semibold text-gray-600">Strike</th>
                <th className="text-center p-2 text-xs font-semibold text-gray-600">Call (CE)</th>
                <th className="text-center p-2 text-xs font-semibold text-gray-600">Put (PE)</th>
              </tr>
            </thead>
            <tbody>
              {filteredChain.map((item) => {
                const isAtm = item.strike === atmStrike
                return (
                  <tr
                    key={item.strike}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isAtm ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.strike}</span>
                        {isAtm && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                            ATM
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      {getOptionDisplay(item.ce, item.strike, 'CE')}
                    </td>
                    <td className="p-2">
                      {getOptionDisplay(item.pe, item.strike, 'PE')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredChain.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No strikes found matching your search
          </div>
        )}
      </CardContent>
    </Card>
  )
}

