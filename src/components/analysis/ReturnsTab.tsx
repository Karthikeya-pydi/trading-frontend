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
  Award,
  Building2
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// Nifty indices data types
interface NiftyIndex {
  filename: string
  index_name: string
  file_size_bytes: number
  last_modified: number
  file_path: string
}

interface NiftyIndicesResponse {
  message: string
  indices: NiftyIndex[]
  total_count: number
  folder_path: string
}

interface NiftyIndexData {
  message: string
  index_name: string
  filename: string
  total_constituents: number
  file_size_bytes: number
  last_updated: number
  columns: string[]
  data: Array<Record<string, string | number>>
}

interface NiftyIndexConstituentsResponse {
  message: string
  index_name: string
  total_constituents: number
  limit_applied: number | null
  constituents: Array<Record<string, string | number>>
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

  // Nifty indices state
  const [niftyIndices, setNiftyIndices] = useState<NiftyIndex[]>([])
  const [selectedIndex, setSelectedIndex] = useState<string>("")
  const [niftyIndexData, setNiftyIndexData] = useState<NiftyIndexData | null>(null)
  const [niftyLoading, setNiftyLoading] = useState(false)
  const [niftyError, setNiftyError] = useState("")
  
  // Nifty indices pagination
  const [niftyCurrentPage, setNiftyCurrentPage] = useState(1)
  const [niftyItemsPerPage] = useState(20)

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

  // Fetch Nifty indices from API
  const fetchNiftyIndices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NIFTY_INDICES}`, {
        headers
      })

      const data: NiftyIndicesResponse = await response.json()

      if (response.ok) {
        setNiftyIndices(data.indices)
        setNiftyError("")
      } else {
        setNiftyError(data.message || "Failed to fetch Nifty indices")
        setNiftyIndices([])
      }
    } catch (err) {
      console.error('Error fetching Nifty indices:', err)
      setNiftyError(`Failed to fetch Nifty indices: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setNiftyIndices([])
    }
  }, [])

  // Fetch specific Nifty index data
  const fetchNiftyIndexData = useCallback(async (indexName: string) => {
    if (!indexName) return

    setNiftyLoading(true)
    setNiftyError("")
    setNiftyIndexData(null)

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NIFTY_INDEX_DATA}/${encodeURIComponent(indexName)}`, {
        headers
      })

      if (!response.ok) {
        if (response.status === 404) {
          setNiftyError(`Index data not found for "${indexName}". This index may not be available in the database.`)
        } else {
          const errorData = await response.json().catch(() => ({}))
          setNiftyError(errorData.message || `Failed to fetch index data (${response.status})`)
        }
        setNiftyIndexData(null)
        return
      }

      const data: NiftyIndexData = await response.json()
      setNiftyIndexData(data)
      setNiftyError("")
    } catch (err) {
      console.error('Error fetching Nifty index data:', err)
      setNiftyError(`Failed to fetch index data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setNiftyIndexData(null)
    } finally {
      setNiftyLoading(false)
    }
  }, [])

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

    // Apply Nifty index filter
    if (selectedIndex && niftyIndexData?.data) {
      const indexSymbols = niftyIndexData.data.map(row => {
        // Try multiple possible column names for symbol
        const possibleSymbolColumns = [
          'symbol', 'ticker', 'scrip', 'scrip_code', 'instrument', 'name',
          'SYMBOL', 'TICKER', 'SCRIP', 'SCRIP_CODE', 'INSTRUMENT', 'NAME'
        ]
        
        for (const colName of possibleSymbolColumns) {
          if (niftyIndexData.columns.includes(colName) && row[colName]) {
            const value = String(row[colName]).trim()
            if (value && value !== 'null' && value !== 'undefined') {
              return value.toUpperCase()
            }
          }
        }
        
        // If no exact match, try partial matches
        const symbolColumn = niftyIndexData.columns.find(col => 
          col.toLowerCase().includes('symbol') || 
          col.toLowerCase().includes('ticker') ||
          col.toLowerCase().includes('scrip') ||
          col.toLowerCase().includes('instrument')
        )
        
        if (symbolColumn && row[symbolColumn]) {
          const value = String(row[symbolColumn]).trim()
          if (value && value !== 'null' && value !== 'undefined') {
            return value.toUpperCase()
          }
        }
        
        return null
      }).filter(Boolean)

      if (indexSymbols.length > 0) {
        console.log(`Filtering by ${indexSymbols.length} symbols from ${selectedIndex}:`, indexSymbols.slice(0, 10))
        filtered = filtered.filter(record => 
          indexSymbols.includes(record.symbol.toUpperCase())
        )
      }
    }

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
  }, [returnsData, selectedIndex, niftyIndexData, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Nifty indices pagination
  const niftyTotalPages = Math.ceil((niftyIndexData?.data.length || 0) / niftyItemsPerPage)
  const niftyStartIndex = (niftyCurrentPage - 1) * niftyItemsPerPage
  const niftyEndIndex = niftyStartIndex + niftyItemsPerPage
  const currentNiftyData = niftyIndexData?.data.slice(niftyStartIndex, niftyEndIndex) || []

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

  // Handle Nifty indices page change
  const goToNiftyPage = (page: number) => {
    setNiftyCurrentPage(Math.max(1, Math.min(page, niftyTotalPages)))
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

  // Handle index selection change
  const handleIndexChange = (indexName: string) => {
    setSelectedIndex(indexName)
    setNiftyCurrentPage(1) // Reset to first page when selecting new index
    setCurrentPage(1) // Reset stock returns pagination when filter changes
    if (indexName) {
      fetchNiftyIndexData(indexName)
    } else {
      setNiftyIndexData(null)
    }
  }

  // Auto-refresh on mount
  useEffect(() => {
    fetchReturnsData()
    fetchNiftyIndices()
  }, [fetchReturnsData, fetchNiftyIndices])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Returns Analysis</h2>
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

      {/* Nifty Indices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-teal-600" />
            <span>Nifty Indices Analysis</span>
          </CardTitle>
          <CardDescription>
            Select a Nifty index to view its constituent stocks and performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                         <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1">
                 <Label htmlFor="nifty-index-select" className="mb-2 block">Select Nifty Index</Label>
                 <Select value={selectedIndex} onValueChange={handleIndexChange}>
                  <SelectTrigger id="nifty-index-select" className="w-full">
                    <SelectValue placeholder="Choose a Nifty index..." />
                  </SelectTrigger>
                  <SelectContent>
                                         {niftyIndices.map((index, idx) => (
                       <SelectItem key={`index-${index.filename || index.index_name || idx}`} value={index.index_name}>
                         {index.index_name}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchNiftyIndices}
                  variant="outline"
                  size="sm"
                  disabled={niftyLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${niftyLoading ? "animate-spin" : ""}`} />
                  Refresh Indices
                </Button>
              </div>
            </div>

            {/* Nifty Index Data Display */}
            {niftyError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{niftyError}</AlertDescription>
              </Alert>
            )}

            {niftyLoading && (
                          <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mr-3" />
              <span className="text-gray-600">Loading index data...</span>
            </div>
            )}

            {niftyIndexData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-teal-600">Index Name</div>
                    <div className="text-lg font-semibold text-teal-900">{niftyIndexData.index_name}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Total Constituents</div>
                    <div className="text-lg font-semibold text-green-900">{niftyIndexData.total_constituents}</div>
                  </div>
                </div>

                                 {/* Constituents Table */}
                 <div className="space-y-4">
                   <div className="text-sm text-gray-600">
                     Showing {niftyStartIndex + 1}-{Math.min(niftyEndIndex, niftyIndexData.data.length)} of {niftyIndexData.data.length} constituents
                   </div>
                   
                   <div className="overflow-x-auto">
                     <table className="w-full border-collapse border border-gray-200">
                       <thead>
                         <tr className="bg-gray-50">
                                                       {niftyIndexData.columns.map((column) => (
                              <th key={`nifty-header-${column}`} className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {column}
                              </th>
                            ))}
                         </tr>
                       </thead>
                                               <tbody className="bg-white divide-y divide-gray-200">
                          {currentNiftyData.map((row, index) => (
                            <tr key={`nifty-${index}`} className="hover:bg-gray-50">
                              {niftyIndexData.columns.map((column) => (
                                <td key={`${index}-${column}`} className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                                  {row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   </div>

                   {/* Nifty Indices Pagination */}
                   {niftyTotalPages > 1 && (
                     <div className="flex items-center justify-between">
                       <div className="text-sm text-gray-700">
                         Page {niftyCurrentPage} of {niftyTotalPages}
                       </div>
                       <div className="flex items-center space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => goToNiftyPage(1)}
                           disabled={niftyCurrentPage === 1}
                         >
                           <ChevronsLeft className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => goToNiftyPage(niftyCurrentPage - 1)}
                           disabled={niftyCurrentPage === 1}
                         >
                           <ChevronLeft className="h-4 w-4" />
                         </Button>
                         
                         <div className="flex items-center space-x-1">
                           {Array.from({ length: Math.min(5, niftyTotalPages) }, (_, i) => {
                             let pageNum
                             if (niftyTotalPages <= 5) {
                               pageNum = i + 1
                             } else if (niftyCurrentPage <= 3) {
                               pageNum = i + 1
                             } else if (niftyCurrentPage >= niftyTotalPages - 2) {
                               pageNum = niftyTotalPages - 4 + i
                             } else {
                               pageNum = niftyCurrentPage - 2 + i
                             }
                             
                             return (
                               <Button
                                 key={`nifty-page-${pageNum}`}
                                 variant={niftyCurrentPage === pageNum ? "default" : "outline"}
                                 size="sm"
                                 onClick={() => goToNiftyPage(pageNum)}
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
                           onClick={() => goToNiftyPage(niftyCurrentPage + 1)}
                           disabled={niftyCurrentPage === niftyTotalPages}
                         >
                           <ChevronRight className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => goToNiftyPage(niftyTotalPages)}
                           disabled={niftyCurrentPage === niftyTotalPages}
                         >
                           <ChevronsRight className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-teal-600" />
            <span>Search & Filter</span>
          </CardTitle>
                     <CardDescription>
             Search by symbol, fincode, or ISIN, and filter by Nifty indices
           </CardDescription>
        </CardHeader>
                 <CardContent>
           <div className="space-y-4">
             {/* Filter Summary */}
             {selectedIndex && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <Building2 className="h-4 w-4 text-teal-600" />
                       <span className="text-sm font-medium text-teal-900">
                         Filtered by: <span className="font-semibold">{selectedIndex}</span>
                       </span>
                       <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                         {filteredAndSortedData.length} stocks
                       </Badge>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setSelectedIndex("")
                         setNiftyIndexData(null)
                         setCurrentPage(1)
                       }}
                       className="text-teal-600 border-teal-300 hover:bg-teal-100"
                     >
                       Clear Filter
                     </Button>
                   </div>
                   {niftyIndexData ? (
                     <p className="text-xs text-teal-700 mt-2">
                       Showing returns data for stocks that are constituents of {selectedIndex}
                     </p>
                   ) : (
                     <p className="text-xs text-orange-700 mt-2">
                       ⚠️ Index data not available - showing all stocks (filter not applied)
                     </p>
                   )}
                 </div>
             )}

             {/* Search Form */}
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
           </div>
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
               {selectedIndex && (
                                <Badge variant="outline" className="ml-2 bg-teal-50 text-teal-700 border-teal-200">
                 {selectedIndex}
               </Badge>
               )}
             </CardTitle>
                         <CardDescription>
               {selectedIndex ? (
                 <>
                   Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} stocks from {selectedIndex}
                   {returnsData.data.length !== filteredAndSortedData.length && (
                     <span className="text-gray-500 ml-2">
                       (filtered from {returnsData.data.length} total stocks)
                     </span>
                   )}
                 </>
               ) : (
                 `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedData.length)} of ${filteredAndSortedData.length} records`
               )}
             </CardDescription>
          </CardHeader>
                     <CardContent>
             {/* No Results Message */}
             {filteredAndSortedData.length === 0 && selectedIndex && (
               <div className="text-center py-8">
                 <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stocks Found</h3>
                 <p className="text-gray-600 mb-4">
                   No stock returns data found for the selected Nifty index "{selectedIndex}".
                   {!niftyIndexData ? "Index data could not be loaded." : "This might be due to symbol naming differences."}
                 </p>
                 {!niftyIndexData ? (
                   <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                     <li>• Index data not available in the database</li>
                     <li>• API endpoint returned 404 error</li>
                     <li>• Network connectivity issues</li>
                   </ul>
                 ) : (
                   <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                     <li>• Symbol naming differences between index and returns data</li>
                     <li>• No matching stocks in the returns database</li>
                     <li>• Data synchronization issues</li>
                   </ul>
                 )}
                 <Button
                   variant="outline"
                   onClick={() => {
                     setSelectedIndex("")
                     setNiftyIndexData(null)
                   }}
                   className="mt-4"
                 >
                   Clear Filter
                 </Button>
               </div>
             )}

             {/* Data Table */}
             {filteredAndSortedData.length > 0 && (
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
                         key={`header-${period.key}`}
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
                     <tr key={`returns-${record.symbol}-${index}`} className="hover:bg-gray-50">
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
                           <td key={`${record.symbol}-${period.key}`} className="border border-gray-200 px-3 py-2 text-sm">
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
             )}

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
                                 key={`page-${pageNum}`}
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
            <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Returns Data</h3>
            <p className="text-gray-600">Please wait while we fetch the latest stock returns data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
