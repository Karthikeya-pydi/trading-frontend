"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Info,
  Award,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react"
import { formatPercent, formatCurrency } from "@/lib/formatters"
import type { StockAnalytics } from "@/types"

interface StockAnalyticsProps {
  analytics: StockAnalytics
}

export function StockAnalytics({ analytics }: StockAnalyticsProps) {
  const getReturnColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getReturnIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon className="h-4 w-4 text-green-600" />
    if (value < 0) return <TrendingDownIcon className="h-4 w-4 text-red-600" />
    return null
  }

  const getGapColor = (value: number) => {
    if (value > 0) return "text-green-600 bg-green-50"
    if (value < 0) return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  const getGapText = (value: number) => {
    if (value > 0) return "Outperformed"
    if (value < 0) return "Underperformed"
    return "In line with"
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <span>Performance Analytics</span>
          </CardTitle>
          <CardDescription>
            Historical performance metrics and market comparison analysis
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Returns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Returns Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Returns</span>
            </CardTitle>
            <CardDescription>Performance across different timeframes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.returns).map(([period, value]) => (
                <div key={period} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium capitalize">
                      {period === "1d" ? "1 Day" : 
                       period === "1w" ? "1 Week" :
                       period === "1m" ? "1 Month" :
                       period === "6m" ? "6 Months" :
                       period === "1y" ? "1 Year" : period}
                    </Label>
                    {getReturnIcon(value)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`font-mono ${getReturnColor(value)} border-current`}
                  >
                    {formatPercent(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CAGR Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Target className="h-5 w-5 text-green-600" />
              <span>Long-term Growth</span>
            </CardTitle>
            <CardDescription>Compound Annual Growth Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPercent(analytics.cagr["5y"])}
                </div>
                <Label className="text-sm text-gray-600">5-Year CAGR</Label>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Compound Annual Growth Rate shows the average yearly growth over 5 years
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Cap Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Award className="h-5 w-5 text-orange-600" />
              <span>Market Cap</span>
            </CardTitle>
            <CardDescription>Company valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {analytics.market_cap ? formatCurrency(analytics.market_cap) : "N/A"}
                </div>
                <Label className="text-sm text-gray-600">Total Market Value</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <span>Market Comparison</span>
          </CardTitle>
          <CardDescription>
            Performance relative to Nifty 50 benchmark
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.gap_with_nifty).map(([period, value]) => (
              <div key={period} className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium capitalize">
                    {period === "1w" ? "1 Week" :
                     period === "1m" ? "1 Month" :
                     period === "6m" ? "6 Months" :
                     period === "1y" ? "1 Year" :
                     period === "5y_cagr" ? "5Y CAGR" : period}
                  </Label>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getGapColor(value)}`}
                  >
                    {getGapText(value)}
                  </Badge>
                </div>
                <div className={`text-lg font-bold ${getReturnColor(value)}`}>
                  {value > 0 ? "+" : ""}{formatPercent(value)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  vs Nifty 50
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Market Comparison:</strong> This shows how much the stock has outperformed or underperformed 
                the Nifty 50 index over different time periods. Positive values indicate the stock beat the market, 
                while negative values show underperformance.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span>Performance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-medium">{formatCurrency(analytics.current_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">1Y Return:</span>
                  <span className={`font-medium ${getReturnColor(analytics.returns["1y"])}`}>
                    {formatPercent(analytics.returns["1y"])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">5Y CAGR:</span>
                  <span className="font-medium text-green-600">
                    {formatPercent(analytics.cagr["5y"])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap:</span>
                  <span className="font-medium">
                    {analytics.market_cap ? formatCurrency(analytics.market_cap) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Market Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">1Y vs Nifty:</span>
                  <span className={`font-medium ${getReturnColor(analytics.gap_with_nifty["1y"])}`}>
                    {analytics.gap_with_nifty["1y"] > 0 ? "+" : ""}{formatPercent(analytics.gap_with_nifty["1y"])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">6M vs Nifty:</span>
                  <span className={`font-medium ${getReturnColor(analytics.gap_with_nifty["6m"])}`}>
                    {analytics.gap_with_nifty["6m"] > 0 ? "+" : ""}{formatPercent(analytics.gap_with_nifty["6m"])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">1M vs Nifty:</span>
                  <span className={`font-medium ${getReturnColor(analytics.gap_with_nifty["1m"])}`}>
                    {analytics.gap_with_nifty["1m"] > 0 ? "+" : ""}{formatPercent(analytics.gap_with_nifty["1m"])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">5Y CAGR vs Nifty:</span>
                  <span className={`font-medium ${getReturnColor(analytics.gap_with_nifty["5y_cagr"])}`}>
                    {analytics.gap_with_nifty["5y_cagr"] > 0 ? "+" : ""}{formatPercent(analytics.gap_with_nifty["5y_cagr"])}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 