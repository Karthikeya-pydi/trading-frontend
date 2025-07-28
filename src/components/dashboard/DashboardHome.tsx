"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Activity,
  RefreshCw
} from "lucide-react"

interface DashboardHomeProps {
  portfolioSummary?: any
  pnlData?: any
  holdings?: any[]
  holdingsSummary?: any
  dailyPnL?: any
  riskMetrics?: any
  loading?: boolean
  onRefresh?: () => void
  onUpdatePrices?: () => void
  positions?: any[]
  trades?: any[]
  onSquareOffPosition?: (positionId: string) => void
}

export function DashboardHome({
  portfolioSummary,
  pnlData,
  holdings,
  holdingsSummary,
  dailyPnL,
  riskMetrics,
  loading = false,
  onRefresh,
  onUpdatePrices,
  positions = [],
  trades = []
}: DashboardHomeProps) {
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    setLastUpdated(new Date())
  }, [portfolioSummary])

  return (
    <div className="w-full">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Portfolio Value */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{portfolioSummary?.total_value || '0'}
                  </p>
                  <p className={`text-sm ${pnlData?.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnlData?.total_pnl >= 0 ? '+' : ''}₹{pnlData?.total_pnl || '0'} ({pnlData?.total_pnl_percentage || '0'}%)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Balance */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{portfolioSummary?.available_balance || '0'}
                  </p>
                  <p className="text-sm text-gray-500">Ready to trade</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Holdings */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Holdings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {holdings?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Active positions</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's P&L */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's P&L</p>
                  <p className={`text-2xl font-bold ${dailyPnL?.today_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailyPnL?.today_pnl >= 0 ? '+' : ''}₹{dailyPnL?.today_pnl || '0'}
                  </p>
                  <p className={`text-sm ${dailyPnL?.today_pnl_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailyPnL?.today_pnl_percentage >= 0 ? '+' : ''}{dailyPnL?.today_pnl_percentage || '0'}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
} 