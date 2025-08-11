"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Layout } from "@/components/layout/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

// Bhavcopy data types
interface BhavcopyRecord {
  SYMBOL: string
  SERIES: string
  DATE1: string
  PREV_CLOSE: number
  OPEN_PRICE: number
  HIGH_PRICE: number
  LOW_PRICE: number
  LAST_PRICE: number
  CLOSE_PRICE: number
  AVG_PRICE: number
  TTL_TRD_QNTY: number
  TURNOVER_LACS: number
  NO_OF_TRADES: number
  DELIV_QTY: number | string
  DELIV_PER: number | string
}

interface BhavcopyResponse {
  message: string
  total_records: number
  data: BhavcopyRecord[]
}

export default function AnalysisPage() {
  const [bhavcopyData, setBhavcopyData] = useState<BhavcopyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [sortField, setSortField] = useState<keyof BhavcopyRecord>("SYMBOL")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Fetch bhavcopy data from API
  const fetchBhavcopyData = useCallback(async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BHAVCOPY_DATA}`, {
        headers
      })

      const data = await response.json()

      if (response.ok) {
        setBhavcopyData(data)
        setSuccess("Bhavcopy data retrieved successfully")
        setLastUpdated(new Date())
      } else {
        setError(data.message || "Failed to fetch bhavcopy data")
        setBhavcopyData(null)
      }
    } catch (err) {
      console.error('Error fetching bhavcopy data:', err)
      setError(`Failed to fetch bhavcopy data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setBhavcopyData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!bhavcopyData?.data) return []

    let filtered = bhavcopyData.data

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(record => 
        record.SYMBOL.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.SERIES.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    return filtered
  }, [bhavcopyData, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Handle sort
  const handleSort = (field: keyof BhavcopyRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Get change color and icon
  const getChangeColor = (current: number, previous: number) => {
    const change = current - previous
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (current: number, previous: number) => {
    const change = current - previous
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  // Format delivery data
  const formatDeliveryData = (value: number | string) => {
    if (value === '-' || value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString()
    return value
  }

  // Auto-refresh on mount
  useEffect(() => {
    fetchBhavcopyData()
  }, [fetchBhavcopyData])

  return (
    <Layout title="Bhavcopy Data">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bhavcopy Data</h1>
            <p className="text-gray-600 mt-2">Complete market data for all listed securities</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={fetchBhavcopyData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        {bhavcopyData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Data Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bhavcopyData.total_records.toLocaleString()}
                  </div>
                  <Label className="text-sm text-gray-600">Total Records</Label>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredAndSortedData.length.toLocaleString()}
                  </div>
                  <Label className="text-sm text-gray-600">Filtered Records</Label>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalPages}
                  </div>
                  <Label className="text-sm text-gray-600">Total Pages</Label>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentPage}
                  </div>
                  <Label className="text-sm text-gray-600">Current Page</Label>
                </div>
              </div>
              {lastUpdated && (
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    Last updated: {lastUpdated.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Search & Filter</span>
            </CardTitle>
            <CardDescription>
              Search by symbol or series, and sort by any column
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by symbol or series (e.g., RELIANCE, EQ)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Data Table */}
        {bhavcopyData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Market Data Table</span>
              </CardTitle>
              <CardDescription>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("SYMBOL")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Symbol</span>
                          {sortField === "SYMBOL" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("SERIES")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Series</span>
                          {sortField === "SERIES" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("PREV_CLOSE")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Prev Close</span>
                          {sortField === "PREV_CLOSE" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("OPEN_PRICE")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Open</span>
                          {sortField === "OPEN_PRICE" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("HIGH_PRICE")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>High</span>
                          {sortField === "HIGH_PRICE" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("LOW_PRICE")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Low</span>
                          {sortField === "LOW_PRICE" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("CLOSE_PRICE")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Close</span>
                          {sortField === "CLOSE_PRICE" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("TTL_TRD_QNTY")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Volume</span>
                          {sortField === "TTL_TRD_QNTY" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("TURNOVER_LACS")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Turnover (Lacs)</span>
                          {sortField === "TURNOVER_LACS" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("DELIV_PER")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Delivery %</span>
                          {sortField === "DELIV_PER" && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((record, index) => (
                      <tr key={`${record.SYMBOL}-${index}`} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                          {record.SYMBOL}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {record.SERIES}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                          {record.DATE1}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                          ₹{record.PREV_CLOSE.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          <div className={`flex items-center space-x-1 ${getChangeColor(record.OPEN_PRICE, record.PREV_CLOSE)}`}>
                            {getChangeIcon(record.OPEN_PRICE, record.PREV_CLOSE)}
                            <span>₹{record.OPEN_PRICE.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-green-600 font-medium">
                          ₹{record.HIGH_PRICE.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-red-600 font-medium">
                          ₹{record.LOW_PRICE.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          <div className={`flex items-center space-x-1 ${getChangeColor(record.CLOSE_PRICE, record.PREV_CLOSE)}`}>
                            {getChangeIcon(record.CLOSE_PRICE, record.PREV_CLOSE)}
                            <span className="font-medium">₹{record.CLOSE_PRICE.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                          {record.TTL_TRD_QNTY.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                          ₹{record.TURNOVER_LACS.toFixed(2)} L
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                          {formatDeliveryData(record.DELIV_PER)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!bhavcopyData && !loading && !error && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bhavcopy Data</h3>
              <p className="text-gray-600 mb-4">
                Click the refresh button to fetch the latest bhavcopy data from the market.
              </p>
              <Button onClick={fetchBhavcopyData} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Fetch Data
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Bhavcopy Data</h3>
              <p className="text-gray-600">Please wait while we fetch the latest market data...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
