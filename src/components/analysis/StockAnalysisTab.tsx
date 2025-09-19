"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Calendar,
  Loader2,
  RefreshCw,
  Download,
  Info,
  FileSpreadsheet
} from "lucide-react"
import * as XLSX from 'xlsx'
import { StockAnalysisService } from "@/services/stock-analysis.service"
import { 
  StockAnalysisResponse, 
  AvailableStocksResponse,
  DescriptiveStats,
  GlobalAnalysis,
  RollingAnalysis,
  PerStockAnalysis,
  DetailedStockData
} from "@/types"
import {
  formatReturn,
  getReturnColorClass,
  formatNumber,
  formatLargeNumber,
  formatAnalysisDate,
  formatRelativeTime,
  getAnomalyColorClass,
  getAnomalyBadgeVariant,
  formatWindowStatus,
  getWindowStatusColorClass
} from "@/lib/formatters"

interface StockAnalysisTabProps {
  className?: string
}

export default function StockAnalysisTab({ className }: StockAnalysisTabProps) {
  const [searchSymbol, setSearchSymbol] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<StockAnalysisResponse | null>(null)
  const [availableStocks, setAvailableStocks] = useState<string[]>([])
  const [showAvailableStocks, setShowAvailableStocks] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  // Load available stocks on component mount
  useEffect(() => {
    loadAvailableStocks()
  }, [])

  const loadAvailableStocks = useCallback(async () => {
    try {
      const response = await StockAnalysisService.getAvailableStocks()
      setAvailableStocks(response.stocks)
    } catch (error) {
      console.error('Failed to load available stocks:', error)
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchSymbol.trim()) {
      setError("Please enter a stock symbol")
      return
    }

    setLoading(true)
    setError(null)
    setAnalysisData(null)

    try {
      const response = await StockAnalysisService.searchStockAnalysis(searchSymbol.trim())
      setAnalysisData(response)
      // Simple heuristic to detect mock data (mock data has exactly 100 data points)
      // Real backend data typically has thousands of data points
      setIsUsingMockData(response.data_points === 100)
    } catch (error: any) {
      setError(error.message || "Failed to fetch stock analysis")
    } finally {
      setLoading(false)
    }
  }, [searchSymbol])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearResults = () => {
    setAnalysisData(null)
    setError(null)
    setSearchSymbol("")
    setIsUsingMockData(false)
  }

  const refreshAnalysis = () => {
    if (analysisData) {
      handleSearch()
    }
  }

  const exportData = () => {
    if (!analysisData) return
    
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new()
    
    // Sheet 1: Overview and Summary
    const overviewData = [
      ['Stock Analysis Report', ''],
      ['Symbol', analysisData.symbol],
      ['Analysis Date', new Date(analysisData.analysis_date).toLocaleDateString()],
      ['Data Points', analysisData.data_points],
      [''],
      ['Descriptive Statistics', ''],
      ['Mean Return', analysisData.descriptive_stats.mean_return],
      ['Standard Deviation', analysisData.descriptive_stats.std_return],
      ['Skewness', analysisData.descriptive_stats.skew_return],
      ['Kurtosis', analysisData.descriptive_stats.kurtosis_return],
      ['Min Return', analysisData.descriptive_stats.min_return],
      ['Max Return', analysisData.descriptive_stats.max_return],
      ['P1 Return', analysisData.descriptive_stats.p1_return],
      ['P99 Return', analysisData.descriptive_stats.p99_return],
      ['Illiquid Flag', analysisData.descriptive_stats.illiquid_flag ? 'Yes' : 'No'],
      [''],
      ['Global Analysis', ''],
      ['Global Median', analysisData.global_analysis.global_median],
      ['Global MAD', analysisData.global_analysis.global_mad],
      ['Global Outliers', analysisData.global_analysis.global_outlier_count],
      [''],
      ['Rolling Analysis', ''],
      ['10-day Windows', analysisData.rolling_analysis.window_ready_10],
      ['40-day Windows', analysisData.rolling_analysis.window_ready_40],
      ['120-day Windows', analysisData.rolling_analysis.window_ready_120],
      ['Mild Anomalies', analysisData.rolling_analysis.mild_anomaly_count],
      ['Major Anomalies', analysisData.rolling_analysis.major_anomaly_count],
      [''],
      ['Per-Stock Analysis', ''],
      ['Per-Stock Median', analysisData.per_stock_analysis.per_stock_median],
      ['Per-Stock MAD', analysisData.per_stock_analysis.per_stock_mad],
      ['Robust Outliers', analysisData.per_stock_analysis.robust_outlier_count],
      ['Very Extreme', analysisData.per_stock_analysis.very_extreme_count]
    ]
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview')
    
    // Sheet 2: Detailed Stock Data
    const stockDataHeaders = [
      'Date', 'Close Price', 'Log Returns', 'Volume', 
      'Global Outlier', 'Mild Anomaly', 'Major Anomaly', 
      'Robust Outlier', 'Very Extreme', 'Window Ready 10d', 
      'Window Ready 40d', 'Window Ready 120d'
    ]
    
    const stockDataRows = analysisData.detailed_data.map(row => [
      new Date(row.date).toLocaleDateString(),
      row.close,
      row.log_returns,
      row.volume,
      row.global_outlier_flag ? 'Yes' : 'No',
      row.mild_anomaly_flag ? 'Yes' : 'No',
      row.major_anomaly_flag ? 'Yes' : 'No',
      row.robust_outlier_flag ? 'Yes' : 'No',
      row.very_extreme_flag ? 'Yes' : 'No',
      row.window_ready_10 ? 'Yes' : 'No',
      row.window_ready_40 ? 'Yes' : 'No',
      row.window_ready_120 ? 'Yes' : 'No'
    ])
    
    const stockData = [stockDataHeaders, ...stockDataRows]
    const stockDataSheet = XLSX.utils.aoa_to_sheet(stockData)
    XLSX.utils.book_append_sheet(workbook, stockDataSheet, 'Stock Data')
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${analysisData.symbol}_analysis_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-teal-600" />
            <span>Stock Analysis Search</span>
          </CardTitle>
          <CardDescription>
            Enter a stock symbol to get comprehensive analysis including descriptive statistics, 
            anomaly detection, and detailed price data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter stock symbol (e.g., RELIANCE, TCS, HDFC)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchSymbol.trim()}
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Available Stocks Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvailableStocks(!showAvailableStocks)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showAvailableStocks ? 'Hide' : 'Show'} Available Stocks
            </Button>
            
            {analysisData && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAnalysis}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResults}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Available Stocks */}
          {showAvailableStocks && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Available stocks for analysis:</p>
              <div className="flex flex-wrap gap-2">
                {availableStocks.map((stock) => (
                  <Badge
                    key={stock}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => setSearchSymbol(stock)}
                  >
                    {stock}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mock Data Notice */}
      {isUsingMockData && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Development Mode:</strong> Backend service is not available. Showing mock data for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisData && (
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>{analysisData.symbol} Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Analysis completed on {formatAnalysisDate(analysisData.analysis_date)} 
                    ({formatRelativeTime(analysisData.analysis_date)})
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm">
                  {formatLargeNumber(analysisData.data_points)} data points
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Analysis Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Statistics</span>
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Anomalies</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Data Table</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <OverviewSection data={analysisData} />
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="mt-6">
              <StatisticsSection 
                descriptiveStats={analysisData.descriptive_stats}
                globalAnalysis={analysisData.global_analysis}
                rollingAnalysis={analysisData.rolling_analysis}
                perStockAnalysis={analysisData.per_stock_analysis}
              />
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomalies" className="mt-6">
              <AnomaliesSection 
                rollingAnalysis={analysisData.rolling_analysis}
                perStockAnalysis={analysisData.per_stock_analysis}
                globalAnalysis={analysisData.global_analysis}
              />
            </TabsContent>

            {/* Data Table Tab */}
            <TabsContent value="data" className="mt-6">
              <DataTableSection data={analysisData.detailed_data} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

// Overview Section Component
function OverviewSection({ data }: { data: StockAnalysisResponse }) {
  const { descriptive_stats } = data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Mean Return</span>
            <span className={getReturnColorClass(descriptive_stats.mean_return)}>
              {formatReturn(descriptive_stats.mean_return)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Std Deviation</span>
            <span>{formatReturn(descriptive_stats.std_return, false)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Skewness</span>
            <span>{formatNumber(descriptive_stats.skew_return, 4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Kurtosis</span>
            <span>{formatNumber(descriptive_stats.kurtosis_return, 4)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Start Date</span>
            <span>{formatAnalysisDate(descriptive_stats.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">End Date</span>
            <span>{formatAnalysisDate(descriptive_stats.end_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Trading Days</span>
            <span>{formatLargeNumber(descriptive_stats.n_days)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Missing Data</span>
            <span>{formatNumber(descriptive_stats.pct_missing)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Return Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Min Return</span>
            <span className={getReturnColorClass(descriptive_stats.min_return)}>
              {formatReturn(descriptive_stats.min_return)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Max Return</span>
            <span className={getReturnColorClass(descriptive_stats.max_return)}>
              {formatReturn(descriptive_stats.max_return)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">1st Percentile</span>
            <span className={getReturnColorClass(descriptive_stats.p1_return)}>
              {formatReturn(descriptive_stats.p1_return)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">99th Percentile</span>
            <span className={getReturnColorClass(descriptive_stats.p99_return)}>
              {formatReturn(descriptive_stats.p99_return)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Statistics Section Component
function StatisticsSection({ 
  descriptiveStats, 
  globalAnalysis, 
  rollingAnalysis, 
  perStockAnalysis 
}: {
  descriptiveStats: DescriptiveStats
  globalAnalysis: GlobalAnalysis
  rollingAnalysis: RollingAnalysis
  perStockAnalysis: PerStockAnalysis
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Descriptive Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descriptive Statistics</CardTitle>
          <CardDescription>Statistical measures of daily returns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mean</span>
                <span className={getReturnColorClass(descriptiveStats.mean_return)}>
                  {formatReturn(descriptiveStats.mean_return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Std Dev</span>
                <span>{formatReturn(descriptiveStats.std_return, false)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Skewness</span>
                <span>{formatNumber(descriptiveStats.skew_return, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kurtosis</span>
                <span>{formatNumber(descriptiveStats.kurtosis_return, 4)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min</span>
                <span className={getReturnColorClass(descriptiveStats.min_return)}>
                  {formatReturn(descriptiveStats.min_return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max</span>
                <span className={getReturnColorClass(descriptiveStats.max_return)}>
                  {formatReturn(descriptiveStats.max_return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P5</span>
                <span className={getReturnColorClass(descriptiveStats.p5_return)}>
                  {formatReturn(descriptiveStats.p5_return)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P95</span>
                <span className={getReturnColorClass(descriptiveStats.p95_return)}>
                  {formatReturn(descriptiveStats.p95_return)}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Illiquid Flag</span>
            <Badge variant={descriptiveStats.illiquid_flag ? "destructive" : "secondary"}>
              {descriptiveStats.illiquid_flag ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Global vs Per-Stock Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Comparison</CardTitle>
          <CardDescription>Global vs stock-specific analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Global Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Median</span>
                  <span className={getReturnColorClass(globalAnalysis.global_median)}>
                    {formatReturn(globalAnalysis.global_median)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MAD</span>
                  <span>{formatReturn(globalAnalysis.global_mad, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outliers</span>
                  <span>{formatLargeNumber(globalAnalysis.global_outlier_count)}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Per-Stock Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Median</span>
                  <span className={getReturnColorClass(perStockAnalysis.per_stock_median)}>
                    {formatReturn(perStockAnalysis.per_stock_median)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MAD</span>
                  <span>{formatReturn(perStockAnalysis.per_stock_mad, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Robust Outliers</span>
                  <span>{formatLargeNumber(perStockAnalysis.robust_outlier_count)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Very Extreme</span>
                  <span>{formatLargeNumber(perStockAnalysis.very_extreme_count)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rolling Analysis */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Rolling Window Analysis</CardTitle>
          <CardDescription>Analysis across different time windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatLargeNumber(rollingAnalysis.window_ready_10)}
              </div>
              <div className="text-sm text-gray-600">10-day Windows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatLargeNumber(rollingAnalysis.window_ready_40)}
              </div>
              <div className="text-sm text-gray-600">40-day Windows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatLargeNumber(rollingAnalysis.window_ready_120)}
              </div>
              <div className="text-sm text-gray-600">120-day Windows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatLargeNumber(rollingAnalysis.mild_anomaly_count + rollingAnalysis.major_anomaly_count)}
              </div>
              <div className="text-sm text-gray-600">Total Anomalies</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Anomalies Section Component
function AnomaliesSection({ 
  rollingAnalysis, 
  perStockAnalysis, 
  globalAnalysis 
}: {
  rollingAnalysis: RollingAnalysis
  perStockAnalysis: PerStockAnalysis
  globalAnalysis: GlobalAnalysis
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Anomaly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anomaly Summary</CardTitle>
          <CardDescription>Detection of unusual market behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium text-yellow-800">Mild Anomalies</div>
                <div className="text-sm text-yellow-600">|z-score| &gt; 3</div>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {formatLargeNumber(rollingAnalysis.mild_anomaly_count)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium text-orange-800">Major Anomalies</div>
                <div className="text-sm text-orange-600">|z-score| &gt; 6</div>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {formatLargeNumber(rollingAnalysis.major_anomaly_count)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium text-red-800">Robust Outliers</div>
                <div className="text-sm text-red-600">|z-score| &gt; 6 (per-stock)</div>
              </div>
              <Badge variant="destructive">
                {formatLargeNumber(perStockAnalysis.robust_outlier_count)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
              <div>
                <div className="font-medium text-red-900">Very Extreme</div>
                <div className="text-sm text-red-700">|z-score| &gt; 10</div>
              </div>
              <Badge variant="destructive" className="bg-red-800">
                {formatLargeNumber(perStockAnalysis.very_extreme_count)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Outliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Outliers</CardTitle>
          <CardDescription>Outliers detected using global statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {formatLargeNumber(globalAnalysis.global_outlier_count)}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Global outliers detected using global median and MAD
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Global Median:</span>
                <span className={getReturnColorClass(globalAnalysis.global_median)}>
                  {formatReturn(globalAnalysis.global_median)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Global MAD:</span>
                <span>{formatReturn(globalAnalysis.global_mad, false)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Data Table Section Component
function DataTableSection({ data }: { data: DetailedStockData[] }) {
  const [sortField, setSortField] = useState<keyof DetailedStockData | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0
    
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    
    return 0
  })

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: keyof DetailedStockData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detailed Stock Data</CardTitle>
        <CardDescription>
          {formatLargeNumber(data.length)} data points with anomaly flags and window readiness
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th 
                  className="text-left p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('date')}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-right p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('close')}
                >
                  Close {sortField === 'close' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-right p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('log_returns')}
                >
                  Returns {sortField === 'log_returns' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-right p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('volume')}
                >
                  Volume {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center p-2">Anomalies</th>
                <th className="text-center p-2">Windows</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2">{formatAnalysisDate(row.date)}</td>
                  <td className="p-2 text-right">{formatNumber(row.close)}</td>
                  <td className={`p-2 text-right ${getReturnColorClass(row.log_returns)}`}>
                    {formatReturn(row.log_returns)}
                  </td>
                  <td className="p-2 text-right">{formatLargeNumber(row.volume)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {row.global_outlier_flag && (
                        <Badge variant="destructive" className="text-xs">Global</Badge>
                      )}
                      {row.mild_anomaly_flag && (
                        <Badge variant="outline" className="text-xs text-yellow-600">Mild</Badge>
                      )}
                      {row.major_anomaly_flag && (
                        <Badge variant="outline" className="text-xs text-orange-600">Major</Badge>
                      )}
                      {row.robust_outlier_flag && (
                        <Badge variant="destructive" className="text-xs">Robust</Badge>
                      )}
                      {row.very_extreme_flag && (
                        <Badge variant="destructive" className="text-xs bg-red-800">Extreme</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getWindowStatusColorClass(row.window_ready_10)}`}
                      >
                        10d
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getWindowStatusColorClass(row.window_ready_40)}`}
                      >
                        40d
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getWindowStatusColorClass(row.window_ready_120)}`}
                      >
                        120d
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
