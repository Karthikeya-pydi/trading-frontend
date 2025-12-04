'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react'
import type { Strategy, StrategyPosition } from '@/types/strategy-builder'

interface StrategyPnLDisplayProps {
  strategy: Strategy
  className?: string
}

export function StrategyPnLDisplay({ strategy, className }: StrategyPnLDisplayProps) {
  const totalPnL = strategy.total_pnl || 0
  const isProfit = totalPnL >= 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Strategy P&L</span>
          <Badge
            variant={isProfit ? 'default' : 'destructive'}
            className={`${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {isProfit ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {formatCurrency(totalPnL)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Positions Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Positions</h4>
            <div className="space-y-2">
              {Array.isArray(strategy.positions) && strategy.positions.length > 0 ? (
                strategy.positions.map((position, index) => (
                  <PositionRow key={position.position_id || index} position={position} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No positions</p>
              )}
            </div>
          </div>

          {/* Strategy Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Strategy:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">
                  {strategy.strategy_type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Underlying:</span>
                <span className="ml-2 font-semibold text-gray-900">{strategy.underlying}</span>
              </div>
              <div>
                <span className="text-gray-600">Expiry:</span>
                <span className="ml-2 font-semibold text-gray-900">{strategy.expiry_date}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Positions:</span>
                <span className="ml-2 font-semibold text-gray-900">{strategy.positions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PositionRow({ position }: { position: StrategyPosition }) {
  const pnl = position.unrealized_pnl || 0
  const isProfit = pnl >= 0
  const currentPrice = position.current_price || position.avg_price

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900">{position.instrument_name}</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              position.side === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {position.side}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {position.option_type}
          </Badge>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Qty: {position.quantity} • Avg: ₹{position.avg_price.toFixed(2)} • LTP: ₹
          {currentPrice.toFixed(2)}
        </div>
      </div>
      <div className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
        {isProfit ? (
          <TrendingUp className="w-4 h-4 inline mr-1" />
        ) : (
          <TrendingDown className="w-4 h-4 inline mr-1" />
        )}
        ₹{Math.abs(pnl).toFixed(2)}
      </div>
    </div>
  )
}

