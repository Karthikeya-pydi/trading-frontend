"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  LogOut, 
  Settings, 
  RefreshCw, 
  Heart,
  Bell,
  User,
  ChevronDown,
  Search,
  Wallet,
  Menu
} from "lucide-react"
import { TradingService } from "@/services/trading.service"
import { BalanceResponse } from "@/types"

interface HeaderProps {
  toggleSidebar: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function Header({ toggleSidebar, onRefresh, isLoading = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.account-dropdown')) {
        setShowAccountDropdown(false)
      }
    }

    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAccountDropdown])

  // Fetch balance when dropdown opens
  useEffect(() => {
    if (showAccountDropdown && !balance) {
      fetchBalance()
    }
  }, [showAccountDropdown, balance])

  const fetchBalance = async () => {
    setBalanceLoading(true)
    try {
      const balanceData = await TradingService.getBalance()
      setBalance(balanceData)
    } catch (err) {
      console.error("Error fetching balance:", err)
    } finally {
      setBalanceLoading(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return "₹0"
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
  }

  const getBalanceData = () => {
    if (!balance?.balance?.result?.BalanceList?.[0]?.limitObject) {
      return null
    }

    const balanceData = balance.balance.result.BalanceList[0].limitObject
    return {
      cashAvailable: parseFloat(balanceData.RMSSubLimits.cashAvailable) || 0,
      netMarginAvailable: parseFloat(balanceData.RMSSubLimits.netMarginAvailable) || 0,
      marginUtilized: parseFloat(balanceData.RMSSubLimits.marginUtilized) || 0,
      accountId: balanceData.AccountID,
      mtm: parseFloat(balanceData.RMSSubLimits.MTM) || 0,
    }
  }

  const balanceData = getBalanceData()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/stocks?search=${encodeURIComponent(searchQuery.trim().toUpperCase())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-20 transition-all duration-150">
      {/* Backdrop blur and gradient overlay */}
      <div className={`absolute inset-0 bg-white backdrop-blur-md border-b border-gray-200 transition-all duration-150 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}></div>
      
      {/* Header content with exact spacing and animations */}
      <div className="relative flex items-center justify-between h-full px-4 md:px-6">
        {/* Logo section with motion animations */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile menu button */}
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:inline">IIFL Trading</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs hidden sm:inline-flex">
            Connected
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search stocks (e.g., RELIANCE, TCS, INFY)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </form>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden flex-1 mx-2 sm:mx-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 hidden sm:flex"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Mobile refresh button */}
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 sm:hidden p-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          
          {/* Account dropdown */}
          <div className="relative account-dropdown">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 sm:px-4 px-2"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            >
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Account</span>
              <ChevronDown className={`h-4 w-4 sm:ml-1 ml-0 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
            </Button>
            
            {showAccountDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 sm:w-64 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* Balance Display Section */}
                {balanceData && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">Balance</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {balanceData.accountId}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Cash Available:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(balanceData.cashAvailable)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Margin Available:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(balanceData.netMarginAvailable)}
                        </span>
                      </div>
                      {balanceData.mtm !== 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">MTM:</span>
                          <span className={`text-sm font-semibold ${
                            balanceData.mtm > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(balanceData.mtm)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Menu Items */}
                <div className="py-1">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token')
                      window.location.href = '/'
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 