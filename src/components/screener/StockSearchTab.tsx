"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, RefreshCw, CheckCircle, Clock, XCircle, Info } from "lucide-react"
import { api } from "@/lib/api"
import { StockScreeningData, StockSearchResponse } from "@/types"

export default function StockSearchTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockScreeningData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchMessage, setLastSearchMessage] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setLastSearchMessage("")
    
    try {
      const response: StockSearchResponse = await api.searchStocks(searchQuery)
      setSearchResults(response.stocks || [])
      setLastSearchMessage(response.message || "")
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
      setLastSearchMessage("Search failed. Please try again.")
    } finally {
      setIsSearching(false)
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

  return (
    <div className="space-y-6">
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

      {/* Instructions */}
      {searchResults.length === 0 && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>How the Smart Stock Screening System Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-600">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🔍 Step 1: Smart Search</h4>
                <p>Enter a stock symbol or company name. The system automatically checks your database and scrapes fresh data if needed.</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">📊 Step 2: Automatic Data Collection</h4>
                <p>If the stock isn't found, the system automatically scrapes comprehensive financial data from Screener.in in the background.</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">⚡ Step 3: Instant Results</h4>
                <p>Get complete financial data immediately - no waiting, no separate scraping steps, no polling required!</p>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-2">📈 Step 4: Analyze & Screen</h4>
                <p>Use the "Stock Data" tab to view detailed financial analysis, ratios, and comparison data.</p>
              </div>
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
    </div>
  )
}
