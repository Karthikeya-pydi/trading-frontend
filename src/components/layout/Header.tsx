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
  Search
} from "lucide-react"

interface HeaderProps {
  toggleSidebar: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function Header({ toggleSidebar, onRefresh, isLoading = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/stocks?search=${encodeURIComponent(searchQuery.trim().toUpperCase())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-150 ${scrolled ? 'h-16' : 'h-20'}`}>
      {/* Backdrop blur and gradient overlay */}
      <div className={`absolute inset-0 bg-white backdrop-blur-md border-b border-gray-200 transition-all duration-150 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}></div>
      
      {/* Header content with exact spacing and animations */}
      <div className="relative flex items-center justify-between h-full px-4 md:px-6">
        {/* Logo section with motion animations */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">IIFL Trading</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
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
        <div className="md:hidden flex-1 mx-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          {/* Account dropdown */}
          <div className="relative account-dropdown">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            >
              <User className="h-4 w-4 mr-2" />
              Account
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
            </Button>
            
            {showAccountDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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