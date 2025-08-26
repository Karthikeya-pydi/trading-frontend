"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  RefreshCw, 
  Trash2, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react"
import { api } from "@/lib/api"
import { StockScreeningData } from "@/types"

export default function StockListTab() {
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

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header Actions */}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search stocks</Label>
              <Input
                id="search"
                placeholder="Search by symbol or name..."
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
        </CardContent>
      </Card>

      {/* Stocks List */}
      <Card>
        <CardContent className="p-0">
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
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>Getting Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-600">
              <p>1. <strong>Add Stocks:</strong> Use the "Search & Scrape" tab to add stocks to your database</p>
              <p>2. <strong>Monitor Status:</strong> Track scraping status and data freshness</p>
              <p>3. <strong>Manage Data:</strong> Refresh or delete stocks as needed</p>
              <p>4. <strong>View Details:</strong> Use the "Stock Data" tab to analyze individual stocks</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
