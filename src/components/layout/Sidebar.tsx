"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  PieChart,
  Eye,
  TrendingUp,
  Clock,
  BarChart3,
  HelpCircle,
  Menu,
  X,
  Search,
  Filter
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Stocks", href: "/stocks", icon: Search },
  { title: "Watchlist", href: "/wishlist", icon: Eye },
  { title: "Trading", href: "/trading", icon: TrendingUp },
  { title: "Screener", href: "/screener", icon: Filter },
  { title: "Analysis", href: "/analysis", icon: BarChart3 },
  { title: "Support", href: "/support", icon: HelpCircle },
]

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        // On mobile, sidebar should be closed by default
        if (isOpen) {
          toggleSidebar()
        }
      }
    }
    
    if (mounted) {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [mounted, isOpen, toggleSidebar])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
          style={{ top: '5rem' }}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-20 left-0 z-40 h-[calc(100vh-5rem)] w-64 bg-white border-r border-gray-200 transform transition-transform duration-150 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:fixed lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-64`}>
        
        {/* Sidebar header - only show on mobile */}
        <div className="lg:hidden flex items-center justify-end h-16 px-6 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-teal-600/90 to-teal-500/90 text-white shadow-md"
                    : "text-gray-700 hover:bg-teal-50 hover:text-teal-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4 w-4 ${
                    isActive ? "text-white" : "text-gray-500 group-hover:text-teal-600"
                  }`} />
                  <span>{item.title}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  )
} 