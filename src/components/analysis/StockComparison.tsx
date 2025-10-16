"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, TrendingDown, Award, Activity, Shield } from "lucide-react"
import { ComparisonMetrics } from "@/lib/returns-utils"
import { RatingStars, RiskBadge, TrendArrow } from "./Sparkline"

interface StockComparisonProps {
  stocks: ComparisonMetrics[]
  onClose: () => void
  onRemoveStock: (symbol: string) => void
}

export function StockComparison({ stocks, onClose, onRemoveStock }: StockComparisonProps) {
  if (stocks.length === 0) {
    return null
  }

  const formatValue = (value: number | null, suffix: string = '', prefix: string = '') => {
    if (value === null || value === undefined) return '—'
    return `${prefix}${value.toFixed(2)}${suffix}`
  }

  const getReturnColor = (value: number | null) => {
    if (value === null) return 'text-gray-500'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getBestInCategory = (key: keyof ComparisonMetrics) => {
    const values = stocks
      .map(s => typeof s[key] === 'number' ? s[key] as number : null)
      .filter(v => v !== null) as number[]
    
    if (values.length === 0) return null
    return Math.max(...values)
  }

  const categories = [
    {
      name: 'Returns',
      icon: TrendingUp,
      metrics: [
        { key: 'returns_1_week', label: '1 Week', suffix: '%' },
        { key: 'returns_1_month', label: '1 Month', suffix: '%' },
        { key: 'returns_3_months', label: '3 Months', suffix: '%' },
        { key: 'returns_6_months', label: '6 Months', suffix: '%' },
        { key: 'returns_1_year', label: '1 Year', suffix: '%' }
      ]
    },
    {
      name: 'Scores',
      icon: Award,
      metrics: [
        { key: 'raw_score', label: 'Raw Score', suffix: '' },
        { key: 'compositeScore.overall', label: 'Composite', suffix: '' },
        { key: 'compositeScore.momentum', label: 'Momentum', suffix: '' },
        { key: 'compositeScore.quality', label: 'Quality', suffix: '' },
        { key: 'compositeScore.growth', label: 'Growth', suffix: '' }
      ]
    },
    {
      name: 'Risk Metrics',
      icon: Shield,
      metrics: [
        { key: 'riskMetrics.volatility', label: 'Volatility', suffix: '' },
        { key: 'riskMetrics.sharpeRatio', label: 'Sharpe Ratio', suffix: '' },
        { key: 'riskMetrics.consistency', label: 'Consistency', suffix: '%' },
        { key: 'riskMetrics.maxDrawdown', label: 'Max Drawdown', suffix: '%' }
      ]
    },
    {
      name: 'Liquidity',
      icon: Activity,
      metrics: [
        { key: 'turnover', label: 'Turnover', suffix: '', prefix: '₹' }
      ]
    }
  ]

  const getValue = (stock: ComparisonMetrics, key: string): number | null => {
    const keys = key.split('.')
    let value: any = stock
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return null
      }
    }
    
    return typeof value === 'number' ? value : null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-teal-600" />
                <span>Stock Comparison</span>
              </CardTitle>
              <CardDescription>
                Compare {stocks.length} stocks across multiple metrics
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stock Headers */}
          <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: `200px repeat(${stocks.length}, 1fr)` }}>
            <div className="font-semibold text-gray-700">Stock</div>
            {stocks.map(stock => (
              <div key={stock.symbol} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{stock.symbol}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveStock(stock.symbol)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <RatingStars rating={stock.compositeScore.rating} />
                  <div className="text-xs text-gray-600">
                    Percentile: {stock.compositeScore.percentile.toFixed(0)}%
                  </div>
                  <RiskBadge riskLevel={stock.riskMetrics.riskLevel} />
                </div>
              </div>
            ))}
          </div>

          {/* Pattern Analysis */}
          <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: `200px repeat(${stocks.length}, 1fr)` }}>
            <div className="font-semibold text-gray-700">Pattern</div>
            {stocks.map(stock => (
              <div key={`pattern-${stock.symbol}`} className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Trend:</span>
                  <Badge variant={stock.pattern.trendDirection === 'Up' ? 'default' : 'secondary'}>
                    {stock.pattern.trendDirection}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Momentum:</span>
                  <Badge variant="outline">{stock.pattern.momentum}</Badge>
                </div>
                <div className="text-xs text-gray-600">
                  Pattern Score: {stock.pattern.patternScore}/100
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Categories */}
          {categories.map(category => (
            <div key={category.name} className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <category.icon className="h-4 w-4 text-teal-600" />
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                {category.metrics.map((metric, idx) => {
                  const best = getBestInCategory(metric.key as keyof ComparisonMetrics)
                  
                  return (
                    <div 
                      key={metric.key} 
                      className={`grid gap-4 p-3 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      style={{ gridTemplateColumns: `200px repeat(${stocks.length}, 1fr)` }}
                    >
                      <div className="text-sm font-medium text-gray-700">
                        {metric.label}
                      </div>
                      {stocks.map(stock => {
                        const value = getValue(stock, metric.key)
                        const isBest = value !== null && value === best
                        
                        return (
                          <div 
                            key={`${stock.symbol}-${metric.key}`} 
                            className={`text-sm font-medium ${getReturnColor(value)} ${isBest ? 'bg-yellow-100 px-2 py-1 rounded' : ''}`}
                          >
                            <div className="flex items-center space-x-1">
                              {formatValue(value, metric.suffix, metric.prefix)}
                              {isBest && <span className="text-yellow-600 ml-1">🏆</span>}
                              {metric.key.includes('return') && value !== null && (
                                <TrendArrow value={value} threshold={0} />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Winner Summary */}
          <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-900 mb-3">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Best 1Y Return</div>
                <div className="font-bold text-green-600">
                  {stocks.reduce((best, stock) => 
                    (stock.returns_1_year || 0) > (best.returns_1_year || 0) ? stock : best
                  ).symbol}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Highest Score</div>
                <div className="font-bold text-blue-600">
                  {stocks.reduce((best, stock) => 
                    stock.compositeScore.overall > best.compositeScore.overall ? stock : best
                  ).symbol}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Lowest Risk</div>
                <div className="font-bold text-purple-600">
                  {stocks.reduce((best, stock) => {
                    const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 }
                    return riskLevels[stock.riskMetrics.riskLevel] < riskLevels[best.riskMetrics.riskLevel] ? stock : best
                  }).symbol}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close Comparison
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

