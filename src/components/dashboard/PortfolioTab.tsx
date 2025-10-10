"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, X, ChevronUp, ChevronDown } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import { StockBhavcopyDropdown } from "./StockBhavcopyDropdown"
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
  stockScores: Record<string, number | null>
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
  stockScores,
  positions,
  trades,
  loading,
  onRefresh,
  onUpdatePrices,
  onSquareOffPosition
}: PortfolioTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (stockSymbol: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(stockSymbol)) {
      newExpanded.delete(stockSymbol)
    } else {
      newExpanded.add(stockSymbol)
    }
    setExpandedRows(newExpanded)
  }
  
  // Extract holdings data from holdings summary
  const getHoldingsFromData = () => {
    console.log('🔍 PortfolioTab - Raw holdings data:', holdings)
    console.log('🔍 PortfolioTab - Holdings summary data:', holdingsSummary)
    
    // Use holdings summary data if available (new API structure)
    if (holdingsSummary?.holdings && Array.isArray(holdingsSummary.holdings)) {
      console.log('✅ PortfolioTab - Using holdings summary data')
      return holdingsSummary.holdings.map(holding => {
        console.log('🔍 PortfolioTab - Processing holding from summary:', holding)
        
        const processed = {
          instrument: holding.stock_name || holding.isin || 'Unknown',
          quantity: holding.quantity || 0,
          averagePrice: holding.average_price || 0,
          currentPrice: holding.current_price || 0,
          investedValue: holding.investment_value || 0,
          marketValue: holding.current_value || 0,
          unrealizedPnL: holding.unrealized_pnl || 0,
          unrealizedPnLPercent: holding.unrealized_pnl_percent || 0,
          purchaseDate: holding.purchase_date,
          isCollateral: holding.is_collateral || false,
          nseInstrumentId: holding.nse_instrument_id,
          rawScore: holding.raw_score ?? null  // Add raw_score from backend
        }
        console.log('🔍 PortfolioTab - Processed holding from summary:', processed)
        return processed
      })
    }
    
    // Fallback to old holdings data structure
    if (holdings && Array.isArray(holdings) && holdings.length > 0) {
      console.log('⚠️ PortfolioTab - Using fallback holdings data')
      return holdings.map(holding => {
        console.log('🔍 PortfolioTab - Processing holding from fallback:', holding)
        
        const processed = {
          instrument: holding.instrument || holding.ISIN || 'Unknown',
          quantity: holding.quantity || holding.HoldingQuantity || 0,
          averagePrice: holding.average_price || holding.BuyAvgPrice || 0,
          currentPrice: holding.current_price || holding.LTP || holding.BuyAvgPrice || 0,
          investedValue: (holding.invested_value || 0) || ((holding.average_price || holding.BuyAvgPrice || 0) * (holding.quantity || holding.HoldingQuantity || 0)),
          marketValue: (holding.market_value || 0) || ((holding.current_price || holding.LTP || holding.BuyAvgPrice || 0) * (holding.quantity || holding.HoldingQuantity || 0)),
          unrealizedPnL: (holding.unrealized_pnl || 0) || ((holding.current_price || holding.LTP || holding.BuyAvgPrice || 0) - (holding.average_price || holding.BuyAvgPrice || 0)) * (holding.quantity || holding.HoldingQuantity || 0),
          unrealizedPnLPercent: 0,
          purchaseDate: null,
          isCollateral: false,
          nseInstrumentId: null,
          rawScore: null  // No raw_score in fallback data
        }
        console.log('🔍 PortfolioTab - Processed holding from fallback:', processed)
        return processed
      })
    }
    
    console.log('❌ PortfolioTab - No holdings data found, returning empty array')
    return []
  }

  const processedHoldings = getHoldingsFromData()

  // Helper function to get stock score - prioritize raw_score from holding, fallback to stockScores lookup
  const getStockScore = (holding: any): number | null => {
    // First, try to get raw_score directly from the holding object (most efficient)
    if (holding.rawScore !== null && holding.rawScore !== undefined) {
      return holding.rawScore
    }
    
    // Fallback to stockScores lookup (from separate API call)
    if (!holding.instrument) return null
    return stockScores[holding.instrument.toUpperCase()] || null
  }

  // Get portfolio summary data with fallbacks
  const getPortfolioData = () => {
    // Use holdings summary data if available (new API structure)
    if (holdingsSummary) {
      console.log('✅ PortfolioTab - Using holdings summary for portfolio data')
      return {
        totalHoldings: holdingsSummary.total_holdings || processedHoldings.length || 0,
        totalInvestment: holdingsSummary.total_investment || 0,
        totalCurrentValue: holdingsSummary.total_current_value || 0,
        totalPnL: holdingsSummary.unrealized_pnl || 0,
        totalPnLPercent: holdingsSummary.unrealized_pnl_percent || 0,
        dailyPnL: dailyPnL?.daily_pnl || portfolioSummary?.daily_pnl || 0
      }
    }
    
    // Fallback to old calculation method
    console.log('⚠️ PortfolioTab - Using fallback portfolio data calculation')
    const totalInvestment = processedHoldings.reduce((total, holding) => total + holding.investedValue, 0)
    const totalPnL = processedHoldings.reduce((total, holding) => total + holding.unrealizedPnL, 0)
    
    return {
      totalHoldings: processedHoldings.length || 0,
      totalInvestment: portfolioSummary?.total_investment || totalInvestment,
      totalCurrentValue: processedHoldings.reduce((total, holding) => total + holding.marketValue, 0),
      totalPnL: pnlData?.total_pnl || portfolioSummary?.unrealized_pnl || totalPnL,
      totalPnLPercent: totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0,
      dailyPnL: dailyPnL?.daily_pnl || portfolioSummary?.daily_pnl || 0
    }
  }

  const portfolioData = getPortfolioData()

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
        {/* Total Holdings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioData.totalHoldings}
            </div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>

        {/* Investment Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(portfolioData.totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total invested amount
            </p>
          </CardContent>
        </Card>

        {/* Today's P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioData.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(portfolioData.totalPnLPercent)} return
            </p>
          </CardContent>
        </Card>

        {/* Balance */}
        {/* TODO: Add balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioData.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioData.dailyPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              
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
                      <th className="text-left p-3 font-semibold text-lg">Stock Name</th>
                      <th className="text-left p-3 font-semibold text-lg">ISIN</th>
                      <th className="text-left p-3 font-semibold text-lg">Quantity</th>
                      <th className="text-left p-3 font-semibold text-lg">Avg Price</th>
                      <th className="text-left p-3 font-semibold text-lg">Current Price</th>
                      <th className="text-left p-3 font-semibold text-lg">Invested Value</th>
                      <th className="text-left p-3 font-semibold text-lg">Current Value</th>
                      <th className="text-left p-3 font-semibold text-lg">P&L</th>
                      <th className="text-left p-3 font-semibold text-lg">
                        <div className="flex items-center space-x-1">
                          <span>Score</span>
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold text-lg">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedHoldings.map((holding, index) => (
                      <React.Fragment key={holding.instrument + index}>
                        <tr className={index % 2 === 0 ? "bg-white border-b hover:bg-gray-50" : "bg-gray-50 border-b hover:bg-gray-100"}>
                                                  <td className="p-3 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="font-semibold">{holding.instrument}</div>
                              {holding.purchaseDate && (
                                <div className="text-xs text-gray-500">
                                  {new Date(holding.purchaseDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(holding.instrument)}
                              className="h-6 w-6 p-0 hover:bg-blue-50"
                            >
                              {expandedRows.has(holding.instrument) ? (
                                <ChevronUp className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </td>
                          <td className="p-3 text-sm text-gray-600">{holding.nseInstrumentId || 'N/A'}</td>
                          <td className="p-3">{holding.quantity}</td>
                          <td className="p-3">{formatCurrency(holding.averagePrice)}</td>
                          <td className="p-3">{formatCurrency(holding.currentPrice)}</td>
                          <td className="p-3">{formatCurrency(holding.investedValue)}</td>
                          <td className="p-3">{formatCurrency(holding.marketValue)}</td>
                          <td className={`p-3 font-bold ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                            {formatCurrency(holding.unrealizedPnL)}
                            <br />
                            <span className="text-xs">
                              {formatPercent(holding.unrealizedPnLPercent)}
                            </span>
                          </td>
                          <td className="p-3">
                            {(() => {
                              const score = getStockScore(holding)
                              if (score === null || score === undefined) {
                                return <span className="text-gray-400 text-sm">N/A</span>
                              }
                              return (
                                <div className="flex items-center space-x-1">
                                  <span className={`font-semibold text-sm ${
                                    score >= 75 ? 'text-green-600' : 
                                    score >= 50 ? 'text-orange-600' : 
                                    score >= 20 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {score.toFixed(2)}
                                  </span>
                                  <div className={`w-2 h-2 rounded-full ${
                                    score >= 75 ? 'bg-green-500' : 
                                    score >= 50 ? 'bg-orange-500' : 
                                    score >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                </div>
                              )
                            })()}
                          </td>
                          <td className="p-3">
                            {holding.isCollateral ? (
                              <Badge variant="secondary" className="text-xs">Collateral</Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">Regular</Badge>
                            )}
                          </td>
                        </tr>
                        {/* Bhavcopy Dropdown Row */}
                        <tr>
                          <td colSpan={10} className="p-0">
                            <StockBhavcopyDropdown
                              stockSymbol={holding.instrument}
                              stockName={holding.instrument}
                              isExpanded={expandedRows.has(holding.instrument)}
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                    {formatCurrency(riskMetrics.net_exposure || riskMetrics.portfolio_value || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Net Exposure</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatCurrency(riskMetrics.gross_exposure || riskMetrics.total_exposure || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Gross Exposure</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatCurrency(riskMetrics.total_unrealized_loss || riskMetrics.max_loss || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Unrealized Loss</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatPercent(riskMetrics.concentration_risk_percent || riskMetrics.risk_percentage || 0)}
                  </div>
                  <p className="text-sm text-gray-500">Concentration Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 