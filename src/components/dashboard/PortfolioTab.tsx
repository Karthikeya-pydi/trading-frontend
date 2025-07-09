"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, X } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import { 
  PortfolioSummary, 
  PnLData, 
  Holding, 
  HoldingsSummary, 
  DailyPnL, 
  RiskMetrics,
  Position,
  Trade
} from "@/types"

interface PortfolioTabProps {
  portfolioSummary: PortfolioSummary | null
  pnlData: PnLData | null
  holdings: Holding[] | null
  holdingsSummary: HoldingsSummary | null
  dailyPnL: DailyPnL | null
  riskMetrics: RiskMetrics | null
  positions: Position[]
  trades: Trade[]
  loading: boolean
  onRefresh: () => void
  onUpdatePrices: () => void
  onSquareOffPosition: (positionId: string) => void
}

export function PortfolioTab({
  portfolioSummary,
  pnlData,
  holdings,
  holdingsSummary,
  dailyPnL,
  riskMetrics,
  positions,
  trades,
  loading,
  onRefresh,
  onUpdatePrices,
  onSquareOffPosition
}: PortfolioTabProps) {
  
  // Extract holdings data from IIFL response structure
  const getHoldingsFromData = () => {
    if (holdings && Array.isArray(holdings) && holdings.length > 0) {
      return holdings.map(holding => {
        // Handle IIFL nested structure - use any to bypass type check for complex API response
        const holdingData = (holding as any).Holdings || holding
        return {
          instrument: holdingData.ISIN || holdingData.symbol || 'Unknown',
          quantity: holdingData.HoldingQuantity || holdingData.quantity || 0,
          averagePrice: holdingData.BuyAvgPrice || holdingData.average_price || 0,
          currentPrice: holdingData.LTP || holdingData.current_price || holdingData.BuyAvgPrice || 0,
          investedValue: (holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          marketValue: (holdingData.LTP || holdingData.BuyAvgPrice || 0) * (holdingData.HoldingQuantity || 0),
          unrealizedPnL: ((holdingData.LTP || holdingData.BuyAvgPrice || 0) - (holdingData.BuyAvgPrice || 0)) * (holdingData.HoldingQuantity || 0)
        }
      })
    }
    return []
  }

  const processedHoldings = getHoldingsFromData()

  // Calculate P&L percentage for display
  const calculatePnLPercent = () => {
    if (pnlData?.total_pnl && portfolioSummary?.total_investment) {
      return (pnlData.total_pnl / portfolioSummary.total_investment) * 100
    }
    return 0
  }

  return (
    <div className="space-y-12 bg-gray-50 p-4 md:p-8 rounded-xl">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portfolio Overview</h2>
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
          <Button
            onClick={onUpdatePrices}
            disabled={loading}
            variant="outline"
            size="sm"
            className="shadow-sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Update Prices
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioSummary?.total_value || holdingsSummary?.total_invested || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total market value
            </p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(pnlData?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(pnlData?.total_pnl || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(calculatePnLPercent())} return
            </p>
          </CardContent>
        </Card>

        {/* Daily P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dailyPnL?.day_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dailyPnL?.day_pnl || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Daily change
            </p>
          </CardContent>
        </Card>

        {/* Holdings Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {holdingsSummary?.total_holdings || processedHoldings.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>
      </div>

      <hr className="my-4 border-gray-200" />

      {/* Holdings Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" /> Holdings
        </h3>
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Holdings</CardTitle>
            <CardDescription>Your current stock positions</CardDescription>
          </CardHeader>
          <CardContent>
            {processedHoldings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No holdings found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rounded-lg overflow-hidden">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-lg">Instrument</th>
                      <th className="text-left p-3 font-semibold text-lg">Quantity</th>
                      <th className="text-left p-3 font-semibold text-lg">Avg Price</th>
                      <th className="text-left p-3 font-semibold text-lg">Current Price</th>
                      <th className="text-left p-3 font-semibold text-lg">Invested Value</th>
                      <th className="text-left p-3 font-semibold text-lg">Market Value</th>
                      <th className="text-left p-3 font-semibold text-lg">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedHoldings.map((holding, index) => (
                      <tr key={holding.instrument + index} className={index % 2 === 0 ? "bg-white border-b hover:bg-gray-50" : "bg-gray-50 border-b hover:bg-gray-100"}>
                        <td className="p-3 font-medium">{holding.instrument}</td>
                        <td className="p-3">{holding.quantity}</td>
                        <td className="p-3">{formatCurrency(holding.averagePrice)}</td>
                        <td className="p-3">{formatCurrency(holding.currentPrice)}</td>
                        <td className="p-3">{formatCurrency(holding.investedValue)}</td>
                        <td className="p-3">{formatCurrency(holding.marketValue)}</td>
                        <td className={`p-3 font-bold ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                          {formatCurrency(holding.unrealizedPnL)}
                          <br />
                          <span className="text-xs">
                            {formatPercent(holding.investedValue > 0 ? (holding.unrealizedPnL / holding.investedValue) * 100 : 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <hr className="my-4 border-gray-200" />

      {/* Trade History Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 mt-8">
          <Activity className="h-6 w-6 text-purple-600" /> Trade History
        </h3>
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Trade History</CardTitle>
            <CardDescription>All executed trades</CardDescription>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No trades found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full rounded-lg overflow-hidden">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-lg">Symbol</th>
                      <th className="text-left p-3 font-semibold text-lg">Side</th>
                      <th className="text-left p-3 font-semibold text-lg">Quantity</th>
                      <th className="text-left p-3 font-semibold text-lg">Price</th>
                      <th className="text-left p-3 font-semibold text-lg">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, idx) => (
                      <tr key={trade.trade_id} className={idx % 2 === 0 ? "bg-white border-b hover:bg-gray-50" : "bg-gray-50 border-b hover:bg-gray-100"}>
                        <td className="p-3 font-medium">{trade.symbol}</td>
                        <td className="p-3">
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'} className={trade.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {trade.side}
                          </Badge>
                        </td>
                        <td className="p-3">{trade.quantity}</td>
                        <td className="p-3">{formatCurrency(trade.price)}</td>
                        <td className="p-3">{new Date(trade.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holdings Summary */}
      {holdingsSummary && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Holdings Summary</h3>
          <Card className="shadow rounded-xl">
            <CardHeader>
              <CardTitle>Holdings Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {holdingsSummary.total_holdings || 0}
                  </div>
                  <p className="text-sm text-gray-500">Total Holdings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(holdingsSummary.total_invested || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Total Investment</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(holdingsSummary.current_value || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Current Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Risk Metrics</h3>
          <Card className="shadow rounded-xl">
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatCurrency(riskMetrics.portfolio_value || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Portfolio Value</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatPercent(riskMetrics.margin_utilization || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Margin Utilization</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatCurrency(riskMetrics.max_loss || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Max Loss</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatPercent(riskMetrics.risk_percentage || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Risk Percentage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 