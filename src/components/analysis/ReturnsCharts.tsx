"use client"

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReturnsRecord } from "@/types"
import { calculateCompositeScore, calculateRiskMetrics, analyzePattern } from "@/lib/returns-utils"
import { TrendingUp, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon, Activity } from "lucide-react"

interface ReturnsChartsProps {
  data: ReturnsRecord[]
  selectedPeriod?: '1_week' | '1_month' | '3_months' | '6_months' | '1_year'
}

export function ReturnsCharts({ data, selectedPeriod = '1_year' }: ReturnsChartsProps) {
  // Returns Distribution Data
  const getReturnsDistribution = () => {
    const returns = data
      .map(record => {
        switch (selectedPeriod) {
          case '1_week': return record.returns_1_week
          case '1_month': return record.returns_1_month
          case '3_months': return record.returns_3_months
          case '6_months': return record.returns_6_months
          case '1_year': return record.returns_1_year
          default: return record.returns_1_year
        }
      })
      .filter(r => r !== null) as number[]

    // Create histogram bins
    const bins = [-100, -50, -25, -10, 0, 10, 25, 50, 100, 200]
    const distribution = bins.map((bin, idx) => {
      if (idx === bins.length - 1) return null
      const nextBin = bins[idx + 1]
      const count = returns.filter(r => r >= bin && r < nextBin).length
      return {
        range: `${bin}% to ${nextBin}%`,
        count,
        percentage: ((count / returns.length) * 100).toFixed(1)
      }
    }).filter(Boolean)

    return distribution
  }

  // Score vs Returns Scatter Data
  const getScoreReturnsData = () => {
    return data
      .filter(record => record.raw_score !== null && record.returns_1_year !== null)
      .map(record => ({
        symbol: record.symbol,
        score: record.raw_score,
        return: record.returns_1_year,
        turnover: record.turnover || 0
      }))
      .slice(0, 200) // Limit to avoid clutter
  }

  // Risk Distribution Data
  const getRiskDistribution = () => {
    const riskCounts = { 'Low': 0, 'Medium': 0, 'High': 0, 'Very High': 0 }
    
    data.forEach(record => {
      const riskMetrics = calculateRiskMetrics(record)
      riskCounts[riskMetrics.riskLevel]++
    })

    return Object.entries(riskCounts).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }))
  }

  // Trend Distribution
  const getTrendDistribution = () => {
    const trendCounts = { 'Up': 0, 'Down': 0, 'Sideways': 0 }
    
    data.forEach(record => {
      const pattern = analyzePattern(record)
      trendCounts[pattern.trendDirection]++
    })

    return Object.entries(trendCounts).map(([trend, count]) => ({
      name: trend,
      value: count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }))
  }

  // Top Performers Data
  const getTopPerformers = (limit: number = 10) => {
    return [...data]
      .filter(record => {
        switch (selectedPeriod) {
          case '1_week': return record.returns_1_week !== null
          case '1_month': return record.returns_1_month !== null
          case '3_months': return record.returns_3_months !== null
          case '6_months': return record.returns_6_months !== null
          case '1_year': return record.returns_1_year !== null
          default: return record.returns_1_year !== null
        }
      })
      .sort((a, b) => {
        const aReturn = a[`returns_${selectedPeriod}`] || 0
        const bReturn = b[`returns_${selectedPeriod}`] || 0
        return bReturn - aReturn
      })
      .slice(0, limit)
      .map(record => ({
        symbol: record.symbol,
        return: record[`returns_${selectedPeriod}`] || 0,
        score: record.raw_score || 0
      }))
  }

  // Composite Score Distribution
  const getCompositeScoreData = (limit: number = 15) => {
    return [...data]
      .slice(0, 100)
      .map(record => {
        const composite = calculateCompositeScore(record, data)
        return {
          symbol: record.symbol,
          Overall: composite.overall,
          Momentum: composite.momentum,
          Quality: composite.quality,
          Value: composite.value,
          Growth: composite.growth
        }
      })
      .sort((a, b) => b.Overall - a.Overall)
      .slice(0, limit)
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  const RISK_COLORS = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#f97316',
    'Very High': '#ef4444'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <span>Returns Analytics & Visualizations</span>
        </CardTitle>
        <CardDescription>
          Visual analysis of returns distribution, scores, and risk metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="scatter">Score vs Return</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="top">Top Performers</TabsTrigger>
            <TabsTrigger value="composite">Composite Scores</TabsTrigger>
          </TabsList>

          {/* Returns Distribution */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Returns Distribution ({selectedPeriod.replace('_', ' ')})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getReturnsDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} fontSize={10} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10b981">
                      {getReturnsDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Trend Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getTrendDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getTrendDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Score vs Returns Scatter */}
          <TabsContent value="scatter">
            <h3 className="text-sm font-semibold mb-3">Raw Score vs 1Y Returns</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="score" 
                  name="Raw Score" 
                  label={{ value: 'Raw Score', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="return" 
                  name="1Y Return %" 
                  label={{ value: '1Y Return %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Stocks" data={getScoreReturnsData()} fill="#3b82f6">
                  {getScoreReturnsData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.return > 50 ? '#10b981' : entry.return < 0 ? '#ef4444' : '#3b82f6'} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Green: High performers (>50% return) • Blue: Moderate • Red: Negative returns
            </p>
          </TabsContent>

          {/* Risk Analysis */}
          <TabsContent value="risk">
            <h3 className="text-sm font-semibold mb-3">Risk Level Distribution</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getRiskDistribution()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#8884d8">
                  {getRiskDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {getRiskDistribution().map((item, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold" style={{ color: RISK_COLORS[item.name as keyof typeof RISK_COLORS] }}>
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-600">{item.name} Risk</div>
                  <div className="text-xs font-semibold text-gray-700">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Top Performers */}
          <TabsContent value="top">
            <h3 className="text-sm font-semibold mb-3">Top 10 Performers ({selectedPeriod.replace('_', ' ')})</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getTopPerformers()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="symbol" type="category" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="return" fill="#10b981" name="Return %" />
                <Bar dataKey="score" fill="#3b82f6" name="Raw Score" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Composite Scores */}
          <TabsContent value="composite">
            <h3 className="text-sm font-semibold mb-3">Top 15 Stocks - Composite Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={getCompositeScoreData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="symbol" fontSize={10} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Overall" dataKey="Overall" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Radar name="Momentum" dataKey="Momentum" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Quality" dataKey="Quality" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Score Breakdown (Top 5 Stocks)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getCompositeScoreData().slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Momentum" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Quality" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Value" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="Growth" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

