'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wifi, WifiOff, RefreshCw, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { API_BASE_URL } from '@/constants'

interface ExchangeStatus {
  NSECM: string
  BSECM: string
  NSEFO: string
}

interface ExchangeStatusResponse {
  status: string
  exchange_status: ExchangeStatus
  message: string
}

export default function ExchangeStatus() {
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fetchExchangeStatus = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to check exchange status')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/trading/exchange-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch exchange status')
      }

      const data: ExchangeStatusResponse = await response.json()
      console.log('📊 ExchangeStatus - Raw response:', data)
      
      if (data.status === 'success' && data.exchange_status) {
        console.log('📊 ExchangeStatus - Setting exchange status:', data.exchange_status)
        setExchangeStatus(data.exchange_status)
        setError('')
      } else {
        console.warn('📊 ExchangeStatus - Unexpected response format:', data)
        throw new Error(data.message || 'Failed to get exchange status')
      }
    } catch (err: any) {
      console.error('❌ ExchangeStatus - Error fetching status:', err)
      setError(err.message || 'Failed to fetch exchange status')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    setRefreshing(true)
    await fetchExchangeStatus()
    setRefreshing(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  useEffect(() => {
    fetchExchangeStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchExchangeStatus, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Wifi className="h-3 w-3 text-green-600" />
      case 'DISCONNECTED':
        return <WifiOff className="h-3 w-3 text-red-600" />
      default:
        return <Activity className="h-3 w-3 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getExchangeName = (segment: string) => {
    switch (segment) {
      case 'NSECM':
        return 'NSE Cash'
      case 'BSECM':
        return 'BSE Cash'
      case 'NSEFO':
        return 'NSE F&O'
      default:
        return segment
    }
  }

  if (loading && !exchangeStatus) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">Checking exchanges...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-red-600 border-red-200">
          <WifiOff className="h-3 w-3 mr-1" />
          Error
        </Badge>
        <Button
          onClick={refreshStatus}
          disabled={refreshing}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    )
  }

  if (!exchangeStatus) {
    console.log('📊 ExchangeStatus - No exchange status data to render')
    return null
  }

  // Check if all exchanges are connected
  const allConnected = Object.values(exchangeStatus).every(status => status === 'CONNECTED')
  const anyDisconnected = Object.values(exchangeStatus).some(status => status === 'DISCONNECTED')
  
  console.log('📊 ExchangeStatus - Rendering with data:', {
    exchangeStatus,
    allConnected,
    anyDisconnected,
    entries: Object.entries(exchangeStatus)
  })

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Overall Status Badge with Dropdown Toggle */}
        <div className="relative">
          <Badge 
            variant="outline" 
            className={`cursor-pointer hover:bg-gray-50 transition-colors ${
              allConnected ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
            }`}
            onClick={toggleDropdown}
          >
            <div className="flex items-center space-x-1">
              {allConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span className="text-xs">
                {allConnected ? 'All Connected' : 'Some Disconnected'}
              </span>
              {isDropdownOpen ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </div>
          </Badge>

          {/* Dropdown */}
          {isDropdownOpen && (
            <Card className="absolute top-full left-0 mt-2 z-50 min-w-[280px] shadow-lg border border-gray-200">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700 mb-2 border-b pb-2">
                    Exchange Status Details
                  </div>
                  {['NSECM', 'BSECM', 'NSEFO'].map((segment) => {
                    const status = exchangeStatus[segment as keyof ExchangeStatus] || 'UNKNOWN'
                    return (
                      <div key={segment} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium text-gray-700">
                            {getExchangeName(segment)}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(status)}`}
                        >
                          {status}
                        </Badge>
                      </div>
                    )
                  })}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          onClick={refreshStatus}
          disabled={refreshing}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          title="Refresh exchange status"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}
