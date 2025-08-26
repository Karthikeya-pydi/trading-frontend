"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Filter, Search, BarChart3, TrendingUp, Activity, PieChart, Building2, Calculator, LineChart, Users, Target, Factory, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Download, Info, Eye, X, BarChart, TrendingUp as TrendingUpIcon, DollarSign, Users as UsersIcon, Factory as FactoryIcon, Globe, Calendar, FileText, PieChart as PieChartIcon, LineChart as LineChartIcon, Building, Target as TargetIcon } from "lucide-react"
import { api } from "@/lib/api"
import { StockScreeningData, StockSearchResponse } from "@/types"

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<StockScreeningData[]>([])
  const [filteredStocks, setFilteredStocks] = useState<StockScreeningData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(10)
  const [deletingStocks, setDeletingStocks] = useState<Set<string>>(new Set())
  const [refreshingStocks, setRefreshingStocks] = useState<Set<string>>(new Set())
  
  // Search functionality
  const [searchResults, setSearchResults] = useState<StockScreeningData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchMessage, setLastSearchMessage] = useState("")

  // View functionality
  const [selectedStock, setSelectedStock] = useState<StockScreeningData | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [stockDetails, setStockDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  useEffect(() => {
    loadStocks()
  }, [currentPage])

  useEffect(() => {
    filterStocks()
  }, [stocks, searchQuery, statusFilter])

  const loadStocks = async () => {
    setIsLoading(true)
    try {
      const skip = (currentPage - 1) * itemsPerPage
      const response = await api.listStocks(skip, itemsPerPage)
      setStocks(response.stocks || [])
      setTotalCount(response.total_count || 0)
    } catch (error) {
      console.error("Failed to load stocks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterStocks = () => {
    let filtered = stocks

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(stock =>
        stock.stock_symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(stock => stock.scraping_status === statusFilter)
    }

    setFilteredStocks(filtered)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setLastSearchMessage("")
    
    try {
      const response: StockSearchResponse = await api.searchStocks(searchQuery)
      setSearchResults(response.stocks || [])
      setLastSearchMessage(response.message || "")
      // Refresh the main stock list after search
      loadStocks()
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
      setLastSearchMessage("Search failed. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleViewStock = async (stock: StockScreeningData) => {
    setSelectedStock(stock)
    setIsViewModalOpen(true)
    setIsLoadingDetails(true)
    
    try {
      const response = await api.getStockData(stock.stock_symbol)
      setStockDetails(response)
    } catch (error) {
      console.error("Failed to load stock details:", error)
      setStockDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedStock(null)
    setStockDetails(null)
  }

  const handleRefreshStock = async (stock: StockScreeningData) => {
    setRefreshingStocks(prev => new Set(prev).add(stock.stock_symbol))
    
    try {
      await api.refreshStockData(stock.stock_symbol)
      // Update the stock status
      setStocks(prev => 
        prev.map(s => 
          s.stock_symbol === stock.stock_symbol 
            ? { ...s, scraping_status: "refreshing" as const }
            : s
        )
      )
    } catch (error) {
      console.error("Failed to refresh stock:", error)
    } finally {
      setRefreshingStocks(prev => {
        const newSet = new Set(prev)
        newSet.delete(stock.stock_symbol)
        return newSet
      })
    }
  }

  const handleDeleteStock = async (stock: StockScreeningData) => {
    if (!confirm(`Are you sure you want to delete ${stock.stock_symbol}? This action cannot be undone.`)) {
      return
    }

    setDeletingStocks(prev => new Set(prev).add(stock.stock_symbol))
    
    try {
      await api.deleteStockData(stock.stock_symbol)
      // Remove the stock from the list
      setStocks(prev => prev.filter(s => s.stock_symbol !== stock.stock_symbol))
      setTotalCount(prev => prev - 1)
    } catch (error) {
      console.error("Failed to delete stock:", error)
    } finally {
      setDeletingStocks(prev => {
        const newSet = new Set(prev)
        newSet.delete(stock.stock_symbol)
        return newSet
      })
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
      case "refreshing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
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

  const getStatusMessage = (stock: StockScreeningData) => {
    if (stock.scraping_status === "success") {
      return `Data last updated: ${new Date(stock.last_scraped_at!).toLocaleString()}`
    } else if (stock.scraping_status === "pending") {
      return "Data collection in progress..."
    } else if (stock.scraping_status === "failed") {
      return `Failed: ${stock.error_message || "Unknown error"}`
    }
    return "Ready to collect data"
  }

  const renderTableData = (data: any, title: string) => {
    if (!data || !data.headers || !data.rows) return null
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          {title === "Quarters Data" && <Calendar className="h-4 w-4" />}
          {title === "Ratios Data" && <BarChart className="h-4 w-4" />}
          {title === "Valuation Data" && <DollarSign className="h-4 w-4" />}
          {title === "Growth Data" && <TrendingUpIcon className="h-4 w-4" />}
          {title === "Industry Data" && <FactoryIcon className="h-4 w-4" />}
          {title === "Shareholding Data" && <UsersIcon className="h-4 w-4" />}
          {title === "Technical Data" && <LineChartIcon className="h-4 w-4" />}
          {title === "Cash Flow Data" && <PieChartIcon className="h-4 w-4" />}
          {title === "Balance Sheet Data" && <FileText className="h-4 w-4" />}
          {title === "Profit Loss Data" && <BarChart className="h-4 w-4" />}
          {title === "Peers Data" && <Building className="h-4 w-4" />}
          {title}
        </h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {data.headers.map((header: string, index: number) => (
                  <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.rows.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <Layout title="Stock Screener">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Screener</h1>
            <p className="text-gray-600 mt-2">Comprehensive stock screening and financial analysis tools</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Smart Stock Search & Analysis</span>
            </CardTitle>
            <CardDescription>
              Search for stocks and automatically get comprehensive financial data from Screener.in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter stock symbol or name (e.g., RELIANCE, TCS, INFY)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {isSearching ? "Searching..." : "Search & Analyze"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-green-600" />
                <span>Search Results ({searchResults.length})</span>
              </CardTitle>
              <CardDescription>
                {lastSearchMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((stock) => (
                  <div key={stock.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {stock.stock_symbol}
                          </h3>
                          {getStatusIcon(stock.scraping_status)}
                          {getStatusBadge(stock.scraping_status)}
                        </div>
                        <p className="text-gray-600 mt-1">{stock.stock_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {getStatusMessage(stock)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {stock.scraping_status === "success" && (
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Data
                          </Button>
                        )}
                        {stock.scraping_status === "failed" && (
                          <Button 
                            onClick={() => handleSearch()}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Retry Search
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Database */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span>Stock Database ({totalCount} stocks)</span>
                </CardTitle>
                <CardDescription>
                  Manage and monitor all stocks in your screening database
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={loadStocks}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="filter-search" className="sr-only">Filter stocks</Label>
                <Input
                  id="filter-search"
                  placeholder="Filter by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="refreshing">Refreshing</option>
                </select>
              </div>
            </div>

            {/* Stocks List */}
            <div className="space-y-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading stocks...</p>
                </div>
              ) : filteredStocks.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">
                    {stocks.length === 0 ? "No stocks found in database" : "No stocks match your filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStocks.map((stock) => (
                        <tr key={stock.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {stock.stock_symbol}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stock.stock_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(stock.scraping_status)}
                              {getStatusBadge(stock.scraping_status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stock.last_scraped_at 
                              ? new Date(stock.last_scraped_at).toLocaleString()
                              : "Never"
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleViewStock(stock)}
                                variant="outline"
                                size="sm"
                                className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleRefreshStock(stock)}
                                disabled={refreshingStocks.has(stock.stock_symbol)}
                                variant="outline"
                                size="sm"
                              >
                                {refreshingStocks.has(stock.stock_symbol) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                <span className="ml-2">
                                  {refreshingStocks.has(stock.stock_symbol) ? "Refreshing..." : "Refresh"}
                                </span>
                              </Button>
                              <Button
                                onClick={() => handleDeleteStock(stock)}
                                disabled={deletingStocks.has(stock.stock_symbol)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {deletingStocks.has(stock.stock_symbol) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="ml-2">
                                  {deletingStocks.has(stock.stock_symbol) ? "Deleting..." : "Delete"}
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-2">Previous</span>
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <span className="mr-2">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {stocks.length === 0 && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Getting Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-600">
                <p>1. <strong>Add Stocks:</strong> Use the search bar above to add stocks to your database</p>
                <p>2. <strong>Monitor Status:</strong> Track scraping status and data freshness</p>
                <p>3. <strong>Manage Data:</strong> Refresh or delete stocks as needed</p>
                <p>4. <strong>View Details:</strong> Use the View button to analyze individual stocks</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Status */}
        {isSearching && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Searching & Analyzing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-blue-700">
                  Searching for "{searchQuery}" and collecting financial data from Screener.in...
                </p>
                <p className="text-sm text-blue-600">
                  This may take a few moments as we gather comprehensive financial information.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Details Modal */}
        {isViewModalOpen && selectedStock && (
          <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                    {selectedStock.stock_symbol}
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedStock.stock_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(selectedStock.scraping_status)}
                    {getStatusBadge(selectedStock.scraping_status)}
                    <span className="text-sm text-gray-500">
                      Last updated: {selectedStock.last_scraped_at 
                        ? new Date(selectedStock.last_scraped_at).toLocaleString()
                        : "Never"
                      }
                    </span>
                  </div>
                </div>
                <Button
                  onClick={closeViewModal}
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {isLoadingDetails ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">Loading stock details...</p>
                  </div>
                ) : stockDetails ? (
                  <div className="space-y-8">
                    {/* Overview Data */}
                    {stockDetails.overview_data && Object.keys(stockDetails.overview_data).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stockDetails.overview_data).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{key}</h4>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{value as string}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Financial Data Tables */}
                    {stockDetails.quarters_data && renderTableData(stockDetails.quarters_data, "Quarters Data")}
                    {stockDetails.ratios_data && renderTableData(stockDetails.ratios_data, "Ratios Data")}
                    {stockDetails.valuation_data && renderTableData(stockDetails.valuation_data, "Valuation Data")}
                    {stockDetails.growth_data && renderTableData(stockDetails.growth_data, "Growth Data")}
                    {stockDetails.industry_data && renderTableData(stockDetails.industry_data, "Industry Data")}
                    {stockDetails.shareholding_data && renderTableData(stockDetails.shareholding_data, "Shareholding Data")}
                    {stockDetails.technical_data && renderTableData(stockDetails.technical_data, "Technical Data")}
                    {stockDetails.cash_flow_data && renderTableData(stockDetails.cash_flow_data, "Cash Flow Data")}
                    {stockDetails.balance_sheet_data && renderTableData(stockDetails.balance_sheet_data, "Balance Sheet Data")}
                    {stockDetails.profit_loss_data && renderTableData(stockDetails.profit_loss_data, "Profit Loss Data")}
                    {stockDetails.peers_data && renderTableData(stockDetails.peers_data, "Peers Data")}

                    {/* Company URL */}
                    {selectedStock.company_url && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Company Website
                        </h4>
                        <a 
                          href={selectedStock.company_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                        >
                          {selectedStock.company_url}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">Failed to load stock details. Please try again.</p>
                    <Button 
                      onClick={() => handleViewStock(selectedStock)}
                      className="mt-4"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
