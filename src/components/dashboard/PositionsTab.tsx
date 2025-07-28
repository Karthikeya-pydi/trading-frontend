"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, X } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import { Position, Trade } from "@/types"

interface PositionsTabProps {
  positions: Position[]
  trades: Trade[]
  loading: boolean
  onRefresh: () => void
  onSquareOffPosition: (positionId: string) => void
}

export function PositionsTab({
  positions,
  trades,
  loading,
  onRefresh,
  onSquareOffPosition
}: PositionsTabProps) {
  
  // Calculate summary data from real positions
  const totalPositions = positions?.length || 0
  const totalPnL = positions?.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0) || 0
  const longPositions = positions?.filter(pos => (pos.quantity || 0) > 0).length || 0
  const shortPositions = positions?.filter(pos => (pos.quantity || 0) < 0).length || 0

  console.log('🔍 PositionsTab - Real positions data:', {
    totalPositions,
    totalPnL,
    longPositions,
    shortPositions,
    positions: positions?.map(p => ({
      id: p.id,
      underlying_instrument: p.underlying_instrument,
      option_type: p.option_type,
      quantity: p.quantity,
      average_price: p.average_price,
      current_price: p.current_price,
      unrealized_pnl: p.unrealized_pnl
    }))
  })

  return (
    <div className="space-y-12 bg-gray-50 p-4 md:p-8 rounded-xl">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Positions Overview</h2>
        <div className="flex space-x-3 justify-end">
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Positions Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Positions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPositions}
            </div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>

        {/* Long Positions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {longPositions}
            </div>
            <p className="text-xs text-muted-foreground">
              Buy positions
            </p>
          </CardContent>
        </Card>

        {/* Short Positions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Short Positions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {shortPositions}
            </div>
            <p className="text-xs text-muted-foreground">
              Sell positions
            </p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Unrealized P&L
            </p>
          </CardContent>
        </Card>
      </div>

      <hr className="my-4 border-gray-200" />

      {/* Positions Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" /> Positions
        </h3>
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Active Positions</CardTitle>
            <CardDescription>Your current trading positions</CardDescription>
          </CardHeader>
          <CardContent>
            {!positions || positions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {loading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    <span>Loading positions...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Activity className="h-12 w-12 text-gray-300" />
                    <span>No active positions found</span>
                    <p className="text-sm text-gray-400">Start trading to see your positions here</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rounded-lg overflow-hidden">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-lg">Instrument</th>
                      <th className="text-left p-3 font-semibold text-lg">Type</th>
                      <th className="text-left p-3 font-semibold text-lg">Quantity</th>
                      <th className="text-left p-3 font-semibold text-lg">Avg Price</th>
                      <th className="text-left p-3 font-semibold text-lg">LTP</th>
                      <th className="text-left p-3 font-semibold text-lg">P&L</th>
                      <th className="text-left p-3 font-semibold text-lg">Stop Loss</th>
                      <th className="text-left p-3 font-semibold text-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position, index) => {
                      const positionId = position.id?.toString() || index.toString()
                      const quantity = position.quantity || 0
                      const avgPrice = position.average_price || 0
                      const currentPrice = position.current_price || 0
                      const pnl = position.unrealized_pnl || 0
                      
                      // Create instrument display name
                      const getInstrumentName = () => {
                        if (position.option_type && position.strike_price) {
                          return `${position.underlying_instrument} ${position.strike_price} ${position.option_type}`
                        }
                        return position.underlying_instrument
                      }
                      
                      // Calculate P&L percentage
                      const pnlPercent = avgPrice > 0 ? (pnl / (avgPrice * Math.abs(quantity))) * 100 : 0
                      
                      return (
                        <tr key={positionId} className={index % 2 === 0 ? "bg-white border-b hover:bg-gray-50" : "bg-gray-50 border-b hover:bg-gray-100"}>
                          <td className="p-3 font-medium">
                            <div>
                              <div className="font-semibold">{getInstrumentName()}</div>
                              {position.expiry_date && (
                                <div className="text-xs text-gray-500">
                                  Exp: {new Date(position.expiry_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <Badge variant={quantity > 0 ? "default" : "secondary"} className="w-fit">
                                {quantity > 0 ? "LONG" : "SHORT"}
                              </Badge>
                              {position.option_type && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {position.option_type}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-bold">
                            <span className={quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(quantity)}
                            </span>
                          </td>
                          <td className="p-3">{formatCurrency(avgPrice)}</td>
                          <td className="p-3">{currentPrice ? formatCurrency(currentPrice) : 'N/A'}</td>
                          <td className={`p-3 font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnl)}
                            <div className="text-xs">
                              {formatPercent(pnlPercent)}
                            </div>
                          </td>
                          <td className="p-3">
                            {position.stop_loss_price ? (
                              <div className="text-sm">
                                <div className="font-medium">{formatCurrency(position.stop_loss_price)}</div>
                                <Badge 
                                  variant={position.stop_loss_active ? "destructive" : "secondary"} 
                                  className="text-xs mt-1"
                                >
                                  {position.stop_loss_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not Set</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Button
                              onClick={() => onSquareOffPosition(positionId)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              {loading ? 'Processing...' : 'Square Off'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      {trades && trades.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Recent Trades</h3>
          <Card className="shadow rounded-xl">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Symbol</th>
                      <th className="text-left p-3">Side</th>
                      <th className="text-left p-3">Quantity</th>
                      <th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0, 10).map((trade, index) => (
                      <tr key={trade.trade_id || index} className="border-b">
                        <td className="p-3 font-medium">{trade.symbol || 'Unknown'}</td>
                        <td className="p-3">
                          <Badge variant={trade.side === 'BUY' ? "default" : "secondary"}>
                            {trade.side || 'UNKNOWN'}
                          </Badge>
                        </td>
                        <td className="p-3">{trade.quantity || 0}</td>
                        <td className="p-3">{formatCurrency(trade.price || 0)}</td>
                        <td className="p-3 text-sm text-gray-500">
                          {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 