"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Calendar
} from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"
import { MarketDataService } from "@/services/market-data.service"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BhavcopyFilesListResponse,
  BhavcopyFileDataResponse,
  BhavcopyFile
} from "@/types"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parse } from "date-fns"

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

export default function BhavcopyTab() {
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

  // File selection state
  const [availableFiles, setAvailableFiles] = useState<BhavcopyFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [filesLoading, setFilesLoading] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Fetch available bhavcopy files
  const fetchAvailableFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const filesResponse = await MarketDataService.getBhavcopyFiles()
      setAvailableFiles(filesResponse.files)
      
      // Auto-select the most recent file if none selected
      if (!selectedFile && filesResponse.files.length > 0) {
        const sortedFiles = filesResponse.files.sort((a, b) => {
          // Sort by date extracted from filename, fallback to last_modified
          const dateA = extractDateFromFilename(a.filename) || new Date(a.last_modified)
          const dateB = extractDateFromFilename(b.filename) || new Date(b.last_modified)
          return dateB.getTime() - dateA.getTime()
        })
        setSelectedFile(sortedFiles[0].filename)
        // Set calendar to show the month of the most recent file
        const fileDate = extractDateFromFilename(sortedFiles[0].filename) || new Date(sortedFiles[0].last_modified)
        setCalendarMonth(fileDate)
      }
    } catch (err) {
      console.error('Error fetching bhavcopy files:', err)
      setError(`Failed to fetch bhavcopy files: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setFilesLoading(false)
    }
  }, [selectedFile])

  // Fetch bhavcopy data from selected file
  const fetchBhavcopyData = useCallback(async (filename?: string) => {
    const fileToFetch = filename || selectedFile
    if (!fileToFetch) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const data = await MarketDataService.getBhavcopyFileData(fileToFetch)
      setBhavcopyData(data)
      setSuccess(`Bhavcopy data retrieved successfully from ${fileToFetch}`)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching bhavcopy data:', err)
      setError(`Failed to fetch bhavcopy data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setBhavcopyData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedFile])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!bhavcopyData?.data) return []

    // Filter out records with missing critical data
    let filtered = bhavcopyData.data.filter(record => 
      record && record.SYMBOL && record.SERIES
    )



    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(record => 
        (record.SYMBOL && record.SYMBOL.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.SERIES && record.SERIES.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1
      
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
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / itemsPerPage))
  const startIndex = Math.max(0, (currentPage - 1) * itemsPerPage)
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)
  const currentData = filteredAndSortedData.slice(startIndex, endIndex)

  // Reset to page 1 if current page is no longer valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

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
    if (totalPages <= 0) return
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }



  // Get change color and icon
  const getChangeColor = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current == null || previous == null || isNaN(current) || isNaN(previous)) return 'text-gray-600'
    const change = current - previous
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current == null || previous == null || isNaN(current) || isNaN(previous)) return <Activity className="h-4 w-4" />
    const change = current - previous
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  // Format delivery data
  const formatDeliveryData = (value: number | string) => {
    if (value === '-' || value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString()
    return value
  }

  // Safe number formatting
  const safeNumberFormat = (value: number | null | undefined, decimals: number = 2) => {
    if (value == null || isNaN(value)) return '-'
    return value.toFixed(decimals)
  }

  // Safe locale string formatting
  const safeLocaleString = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '-'
    return value.toLocaleString()
  }

  // Load files and data on component mount
  useEffect(() => {
    fetchAvailableFiles()
  }, [fetchAvailableFiles])

  // Fetch data when selected file changes
  useEffect(() => {
    if (selectedFile) {
      fetchBhavcopyData(selectedFile)
    }
  }, [selectedFile, fetchBhavcopyData])

  // Handle file selection change
  // Extract date from filename (format: sec_bhavdata_full_18112025 where 18112025 = 18-11-2025, so DDMMYYYY)
  const extractDateFromFilename = (filename: string): Date | null => {
    if (!filename) return null
    
    // Try to find 8-digit date pattern (DDMMYYYY format)
    const dateMatch = filename.match(/(\d{8})/)
    if (dateMatch) {
      const dateStr = dateMatch[1] // e.g., "18112025"
      try {
        // Parse DDMMYYYY format: 18112025 = 18-11-2025
        const day = dateStr.substring(0, 2)
        const month = dateStr.substring(2, 4)
        const year = dateStr.substring(4, 8)
        const date = parse(`${day}-${month}-${year}`, 'dd-MM-yyyy', new Date())
        if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
          return date
        }
      } catch (e) {
        console.warn('Failed to parse date from filename:', e)
      }
    }
    
    return null
  }

  // Find file by date from calendar
  const findFileByDate = useCallback((date: Date): BhavcopyFile | null => {
    const dateStr = format(date, 'ddMMyyyy') // e.g., "18112025"
    
    // Try to find exact match in filename
    const matchedFile = availableFiles.find(file => {
      const fileDate = extractDateFromFilename(file.filename)
      if (!fileDate) return false
      
      const fileDateStr = format(fileDate, 'ddMMyyyy')
      return fileDateStr === dateStr || isSameDay(fileDate, date)
    })
    
    return matchedFile || null
  }, [availableFiles])

  // Get dates that have available files
  const getAvailableDates = useMemo(() => {
    const dates = new Map<string, BhavcopyFile>()
    availableFiles.forEach(file => {
      const fileDate = extractDateFromFilename(file.filename)
      if (fileDate) {
        const dateKey = format(fileDate, 'yyyy-MM-dd')
        dates.set(dateKey, file)
      }
    })
    return dates
  }, [availableFiles])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get first day of month to pad calendar (Monday = 0)
    const firstDayOfWeek = getDay(monthStart)
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    return {
      days: daysInMonth,
      paddingDays
    }
  }, [calendarMonth])

  // Handle date selection from calendar
  const handleDateSelect = async (date: Date) => {
    const matchedFile = findFileByDate(date)
    
    if (matchedFile) {
      setSelectedFile(matchedFile.filename)
      setCurrentPage(1)
      setIsCalendarOpen(false)
      setError("")
      // Fetch the data
      await fetchBhavcopyData(matchedFile.filename)
    } else {
      setError(`No data available for ${format(date, 'dd-MM-yyyy')}`)
      setSuccess("")
      setIsCalendarOpen(false)
    }
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isCalendarOpen])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bhavcopy Data</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Complete market data for all listed securities</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await fetchAvailableFiles()
              if (selectedFile) {
                await fetchBhavcopyData()
              }
            }}
            variant="outline"
            size="sm"
            disabled={filesLoading || loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(filesLoading || loading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Section */}
      {bhavcopyData && bhavcopyData.data && bhavcopyData.data.length > 0 && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-teal-600" />
            <span>Search & Filter</span>
          </CardTitle>
          <CardDescription>
            Search by symbol or series, and sort by any column
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="search-input" className="text-sm font-medium text-gray-700 mb-2 block">
                  Search
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="search-input"
                    placeholder="Search by symbol or series (e.g., RELIANCE, EQ)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                      <Search className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Search</span>
                      <span className="sm:hidden">Search</span>
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
                        className="flex-1 sm:flex-none"
                      >
                        <span className="hidden sm:inline">Clear Filters</span>
                        <span className="sm:hidden">Clear</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Alerts */}
      {(error || success) && (
        <>
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
        </>
      )}

      {/* Data Table */}
      {bhavcopyData && filteredAndSortedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-xl font-semibold">Market Data Table</span>
                </div>
                <div className="relative" ref={calendarRef}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    disabled={filesLoading}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  
                  {/* Calendar Popup */}
                  {isCalendarOpen && (
                    <div 
                      className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[320px] max-w-[calc(100vw-2rem)]"
                      style={{ right: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-sm font-semibold">
                          {format(calendarMonth, 'MMMM yyyy')}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                          className="h-8 w-8 p-0"
                          disabled={format(addMonths(calendarMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Calendar Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Padding days */}
                        {Array.from({ length: calendarDays.paddingDays }).map((_, i) => (
                          <div key={`pad-${i}`} className="h-9" />
                        ))}
                        
                        {/* Calendar days */}
                        {calendarDays.days.map((day) => {
                          const dayStr = format(day, 'yyyy-MM-dd')
                          const fileForDate = getAvailableDates.get(dayStr)
                          const hasData = !!fileForDate
                          const isSelected = selectedFile && fileForDate?.filename === selectedFile
                          const isToday = isSameDay(day, new Date())
                          
                          // Check if date is in the past or today
                          const now = new Date()
                          const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                          const isSelectable = dayStart <= todayStart
                          
                          return (
                            <button
                              key={dayStr}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (isSelectable) {
                                  handleDateSelect(day)
                                }
                              }}
                              disabled={!isSelectable}
                              className={`
                                h-9 w-9 text-sm rounded-md transition-colors
                                ${isSelected 
                                  ? 'bg-teal-600 text-white font-semibold hover:bg-teal-700' 
                                  : hasData && isSelectable
                                    ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 cursor-pointer active:bg-teal-200'
                                    : isSelectable
                                      ? 'text-gray-600 hover:bg-gray-100 cursor-pointer active:bg-gray-200'
                                      : 'text-gray-300 cursor-not-allowed opacity-50'
                                }
                                ${isToday && !isSelected ? 'ring-2 ring-teal-500' : ''}
                              `}
                              title={isSelectable 
                                ? (hasData ? `Data available - ${format(day, 'dd-MM-yyyy')}` : `No data - ${format(day, 'dd-MM-yyyy')}`)
                                : 'Future dates are not available'
                              }
                            >
                              {format(day, 'd')}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-teal-50 border border-teal-200"></div>
                          <span className="text-gray-600">Data available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-gray-100"></div>
                          <span className="text-gray-600">No data</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CardDescription>
              {filteredAndSortedData.length > 0 
                ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedData.length)} of ${filteredAndSortedData.length} records`
                : 'No records found'
              }
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
                      onClick={() => handleSort("LAST_PRICE")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Price</span>
                        {sortField === "LAST_PRICE" && (
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
                      onClick={() => handleSort("AVG_PRICE")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Avg Price</span>
                        {sortField === "AVG_PRICE" && (
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
                      onClick={() => handleSort("NO_OF_TRADES")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>No. of Trades</span>
                        {sortField === "NO_OF_TRADES" && (
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
                      onClick={() => handleSort("DELIV_QTY")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Delivery Qty</span>
                        {sortField === "DELIV_QTY" && (
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
                    <tr key={`${record.SYMBOL || 'unknown'}-${index}`} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900">
                        {record.SYMBOL || '-'}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {record.SERIES || '-'}
                        </Badge>
                      </td>

                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                        {record.DATE1 || '-'}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        ₹{safeNumberFormat(record.PREV_CLOSE)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        <div className={`flex items-center space-x-1 ${getChangeColor(record.OPEN_PRICE, record.PREV_CLOSE)}`}>
                          {getChangeIcon(record.OPEN_PRICE, record.PREV_CLOSE)}
                          <span>₹{safeNumberFormat(record.OPEN_PRICE)}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-green-600 font-medium">
                        ₹{safeNumberFormat(record.HIGH_PRICE)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-red-600 font-medium">
                        ₹{safeNumberFormat(record.LOW_PRICE)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        <div className={`flex items-center space-x-1 ${getChangeColor(record.LAST_PRICE, record.PREV_CLOSE)}`}>
                          {getChangeIcon(record.LAST_PRICE, record.PREV_CLOSE)}
                          <span>₹{safeNumberFormat(record.LAST_PRICE)}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">
                        <div className={`flex items-center space-x-1 ${getChangeColor(record.CLOSE_PRICE, record.PREV_CLOSE)}`}>
                          {getChangeIcon(record.CLOSE_PRICE, record.PREV_CLOSE)}
                          <span className="font-medium">₹{safeNumberFormat(record.CLOSE_PRICE)}</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        ₹{safeNumberFormat(record.AVG_PRICE)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        {safeLocaleString(record.TTL_TRD_QNTY)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        {safeLocaleString(record.NO_OF_TRADES)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        ₹{safeNumberFormat(record.TURNOVER_LACS)} L
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-900">
                        {formatDeliveryData(record.DELIV_QTY)}
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
            {totalPages > 1 && filteredAndSortedData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs sm:text-sm text-gray-700">
                  {filteredAndSortedData.length > 0 
                    ? `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredAndSortedData.length)} of ${filteredAndSortedData.length} results`
                    : 'No results found'
                  }
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="hidden sm:flex"
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
                    <span className="text-sm px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <div className="hidden sm:flex items-center space-x-1">
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
                    className="hidden sm:flex"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State - Show first during initial load or when loading */}
      {(loading || filesLoading) && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Bhavcopy Data</h3>
            <p className="text-gray-600">Please wait while we fetch the latest market data...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Only show when not loading and no data */}
      {(!bhavcopyData || bhavcopyData.data.length === 0) && !loading && !filesLoading && !error && (
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
              {loading ? 'Fetching...' : 'Fetch Data'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
