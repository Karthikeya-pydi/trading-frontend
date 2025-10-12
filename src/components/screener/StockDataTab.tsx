"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  Calculator, 
  Building2, 
  LineChart, 
  Users, 
  CheckCircle,
  Clock,
  XCircle,
  Info
} from "lucide-react"
import { api } from "@/lib/api"
import { StockScreeningData } from "@/types"

export default function StockDataTab() {
  const [stockSymbol, setStockSymbol] = useState("")
  const [stockData, setStockData] = useState<StockScreeningData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const handleSearch = async () => {
    if (!stockSymbol.trim()) return
    
    setIsLoading(true)
    try {
      const response = await api.getStockData(stockSymbol.toUpperCase())
      setStockData(response)
    } catch (error) {
      console.error("Failed to fetch stock data:", error)
      setStockData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!stockData) return
    
    setIsRefreshing(true)
    try {
      const response = await api.searchStocks(stockData.stock_symbol)
      if (response.stocks && response.stocks.length > 0) {
        setStockData(response.stocks[0])
      }
    } catch (error) {
      console.error("Failed to refresh stock data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      pending: "secondary",
      refreshing: "outline"
    }
    
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const renderTableData = (data: any) => {
    if (!data || !data.headers || !data.rows) return null
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {data.headers.map((header: string, index: number) => (
                <th key={index} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell: string, cellIndex: number) => (
                  <td key={cellIndex} className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderOverviewData = (data: Record<string, string>) => {
    if (!data) return null
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-1">{key}</h4>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    )
  }

  const hasDataSection = (data: any) => {
    return data && data.headers && data.rows && data.rows.length > 0
  }

  const getDataSectionCount = () => {
    if (!stockData) return 0
    let count = 0
    if (hasDataSection(stockData.quarters_data)) count++
    if (hasDataSection(stockData.peers_data)) count++
    if (hasDataSection(stockData.profit_loss_data)) count++
    if (hasDataSection(stockData.balance_sheet_data)) count++
    if (hasDataSection(stockData.ratios_data)) count++
    if (hasDataSection(stockData.cash_flow_data)) count++
    if (hasDataSection(stockData.shareholding_data)) count++
    if (hasDataSection(stockData.technical_data)) count++
    if (hasDataSection(stockData.valuation_data)) count++
    if (hasDataSection(stockData.growth_data)) count++
    if (hasDataSection(stockData.industry_data)) count++
    if (stockData.overview_data && Object.keys(stockData.overview_data).length > 0) count++
    return count
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>View Stock Financial Data</span>
          </CardTitle>
          <CardDescription>
            Enter a stock symbol to view comprehensive financial analysis and ratios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !stockSymbol.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Data Display */}
      {stockData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>{stockData.stock_symbol} - {stockData.stock_name}</span>
                  {getStatusIcon(stockData.scraping_status)}
                  {getStatusBadge(stockData.scraping_status)}
                </CardTitle>
                <CardDescription>
                  Comprehensive financial data and analysis
                  {stockData.last_scraped_at && (
                    <span className="ml-2">
                      • Last updated: {new Date(stockData.last_scraped_at).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stockData.scraping_status === "success" ? (
              <div>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Data Available</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Found {getDataSectionCount()} data sections. Use the tabs below to explore different financial metrics.
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6">
                    <TabsTrigger value="overview" className="flex items-center justify-center gap-1">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="flex items-center justify-center gap-1">
                      <Calculator className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Financials</span>
                    </TabsTrigger>
                    <TabsTrigger value="ratios" className="flex items-center justify-center gap-1">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Ratios</span>
                    </TabsTrigger>
                    <TabsTrigger value="quarters" className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Quarters</span>
                    </TabsTrigger>
                    <TabsTrigger value="peers" className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Peers</span>
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="flex items-center justify-center gap-1">
                      <LineChart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="text-xs">Technical</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {stockData.overview_data && Object.keys(stockData.overview_data).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Company Overview</h3>
                        {renderOverviewData(stockData.overview_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.shareholding_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Shareholding Pattern</h3>
                        {renderTableData(stockData.shareholding_data)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="financials" className="space-y-6">
                    {hasDataSection(stockData.profit_loss_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Profit & Loss Statement</h3>
                        {renderTableData(stockData.profit_loss_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.balance_sheet_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Balance Sheet</h3>
                        {renderTableData(stockData.balance_sheet_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.cash_flow_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Cash Flow Statement</h3>
                        {renderTableData(stockData.cash_flow_data)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ratios" className="space-y-6">
                    {hasDataSection(stockData.ratios_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Financial Ratios</h3>
                        {renderTableData(stockData.ratios_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.valuation_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Valuation Metrics</h3>
                        {renderTableData(stockData.valuation_data)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="quarters" className="space-y-6">
                    {hasDataSection(stockData.quarters_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Quarterly Results</h3>
                        {renderTableData(stockData.quarters_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.growth_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
                        {renderTableData(stockData.growth_data)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="peers" className="space-y-6">
                    {hasDataSection(stockData.peers_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Peer Comparison</h3>
                        {renderTableData(stockData.peers_data)}
                      </div>
                    )}
                    {hasDataSection(stockData.industry_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Industry Comparison</h3>
                        {renderTableData(stockData.industry_data)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-6">
                    {hasDataSection(stockData.technical_data) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Technical Indicators</h3>
                        {renderTableData(stockData.technical_data)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : stockData.scraping_status === "pending" ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Data Collection in Progress</h3>
                <p className="text-gray-600">Financial data is being collected from Screener.in. This may take a few minutes.</p>
                <div className="mt-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Data Collection Failed</h3>
                <p className="text-gray-600">{stockData.error_message || "Failed to collect financial data."}</p>
                <Button 
                  onClick={handleRefresh}
                  className="mt-4"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!stockData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>How to View Stock Financial Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-600">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🔍 Step 1: Search</h4>
                <p>Enter a stock symbol in the search box above (e.g., RELIANCE, TCS, INFY).</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">📊 Step 2: View Data</h4>
                <p>Browse through different financial data tabs to analyze the stock's performance.</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">🔄 Step 3: Keep Updated</h4>
                <p>Use the refresh button to get the latest financial data from Screener.in.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
