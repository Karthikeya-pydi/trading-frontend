"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  ChevronsRight,
  Award
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

// Returns data types
interface StockReturns {
  symbol: string
  fincode: string
  isin: string
  latest_date: string
  latest_close: number
  latest_volume: number
  returns_1_week: number | null
  returns_1_month: number | null
  returns_3_months: number | null
  returns_6_months: number | null
  returns_1_year: number | null
  returns_3_years: number | null
  returns_5_years: number | null
}

interface ReturnsResponse {
  status: string
  data: StockReturns[]
  total_count: number
  source_file: string
  timestamp: string
}

export default function ReturnsTab() {
  const [returnsData, setReturnsData] = useState<ReturnsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [sortField, setSortField] = useState<keyof StockReturns>("symbol")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Available time periods
  const timePeriods = [
    { key: "1_Week", label: "1 Week" },
    { key: "1_Month", label: "1 Month" },
    { key: "3_Months", label: "3 Months" },
    { key: "6_Months", label: "6 Months" },
    { key: "1_Year", label: "1 Year" },
    { key: "3_Years", label: "3 Years" },
    { key: "5_Years", label: "5 Years" }
  ]

  // Fetch returns data from API
  const fetchReturnsData = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RETURNS_ALL}`, {
        headers
      })

      const data = await response.json()

      if (response.ok) {
        setReturnsData(data)
        setSuccess("Returns data retrieved successfully")
      } else {
        setError(data.detail || "Failed to fetch returns data")
        setReturnsData(null)
      }
    } catch (err) {
      console.error('Error fetching returns data:', err)
      setError(`Failed to fetch returns data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setReturnsData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!returnsData?.data) return []

    let filtered = returnsData.data

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(record => 
        record.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.fincode.includes(searchQuery) ||
        record.isin.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [returnsData, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Handle sort
  const handleSort = (field: keyof StockReturns) => {
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

  // Get return value for selected period
  const getReturnValue = (record: StockReturns, period: string) => {
    switch (period) {
      case "1_Week": return record.returns_1_week
      case "1_Month": return record.returns_1_month
      case "3_Months": return record.returns_3_months
      case "6_Months": return record.returns_6_months
      case "1_Year": return record.returns_1_year
      case "3_Years": return record.returns_3_years
      case "5_Years": return record.returns_5_years
      default: return record.returns_1_year
    }
  }

  // Get return color and icon
  const getReturnColor = (value: number | null) => {
    if (value === null) return 'text-gray-500'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getReturnIcon = (value: number | null) => {
    if (value === null) return null
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  // Format return value
  const formatReturn = (value: number | null) => {
    if (value === null) return '-'
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Auto-refresh on mount
  useEffect(() => {
    fetchReturnsData()
  }, [fetchReturnsData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Returns Analysis</h2>
          <p className="text-gray-600 mt-1">Performance data for 2,822 active stocks across multiple time periods</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchReturnsData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Search & Filter</span>
          </CardTitle>
          <CardDescription>
            Search by symbol, fincode, or ISIN, and sort by any column
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by symbol, fincode, or ISIN (e.g., RELIANCE, 500325, INE002A01018)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setCurrentPage(1)
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
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
      {returnsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Stock Returns Data</span>
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
                      onClick={() => handleSort("symbol")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Symbol</span>
                        {sortField === "symbol" && (
                          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fincode
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Close
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    {timePeriods.map((period) => (
                      <th 
                        key={period.key}
                        className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(`returns_${period.key.toLowerCase()}` as keyof StockReturns)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{period.label}</span>
                          {sortField === `returns_${period.key.toLowerCase()}` && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((record, index) => (
                    <tr key={`${record.symbol}-${index}`} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                        {record.symbol}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                        {record.fincode}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                        ₹{record.latest_close.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                        {record.latest_volume.toLocaleString()}
                      </td>
                      {timePeriods.map((period) => {
                        const returnValue = getReturnValue(record, period.key)
                        return (
                          <td key={period.key} className="border border-gray-200 px-3 py-2 text-sm">
                            <div className={`flex items-center space-x-1 ${getReturnColor(returnValue)}`}>
                              {getReturnIcon(returnValue)}
                              <span className="font-medium">{formatReturn(returnValue)}</span>
                            </div>
                          </td>
                        )
                      })}
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
      {!returnsData && !loading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Returns Data</h3>
            <p className="text-gray-600 mb-4">
              Click the refresh button to fetch the latest stock returns data.
            </p>
            <Button onClick={fetchReturnsData} disabled={loading}>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Returns Data</h3>
            <p className="text-gray-600">Please wait while we fetch the latest stock returns data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
