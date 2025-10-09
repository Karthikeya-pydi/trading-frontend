"use client"

import { useState, useEffect } from "react"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

interface LayoutProps {
  children: React.ReactNode
  title?: string
  onRefresh?: () => void
  isLoading?: boolean
}

export function Layout({ children, title, onRefresh, isLoading = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    if (mounted) {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [mounted])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header 
        toggleSidebar={toggleSidebar}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`transition-all duration-300 lg:ml-64`}>
        <main className="px-3 sm:px-4 md:px-6 pb-12 pt-24 bg-white min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
} 