"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Shield, Zap, BarChart3, LogOut } from "lucide-react"

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setAuthLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsAuthenticated(false)
        setAuthLoading(false)
        return
      }

      // Check user profile and credentials status
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
      })

      if (response.ok) {
        const user = await response.json()
        setIsAuthenticated(true)
        
        // Check if user has any IIFL credentials configured
        const hasAnyCredentials = user.has_iifl_market_credentials || user.has_iifl_interactive_credentials
        setHasCredentials(hasAnyCredentials)
        
        console.log('Auth status:', { 
          authenticated: true, 
          hasCredentials: hasAnyCredentials,
          interactive: user.has_iifl_interactive_credentials,
          market: user.has_iifl_market_credentials
        })
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        setHasCredentials(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      // If there's an error, assume not authenticated but don't remove token
      // in case it's just a network issue
      setIsAuthenticated(false)
      setHasCredentials(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Redirect to backend Google OAuth endpoint with callback URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const FRONTEND_URL = window.location.origin
      const callbackUrl = `${FRONTEND_URL}/auth/callback`
      
      const oauthUrl = `${API_BASE_URL}/api/auth/oauth/google/login?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(callbackUrl)}`
      
      console.log('🚀 Starting Google OAuth...')
      console.log('📍 Frontend URL:', FRONTEND_URL)  
      console.log('🔙 Callback URL:', callbackUrl)
      console.log('🌐 OAuth URL:', oauthUrl)
      
      window.location.href = oauthUrl
    } catch (error) {
      console.error("Login failed:", error)
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout process...')
      
      // Clear token from localStorage
      localStorage.removeItem('token')
      console.log('🗑️ Token removed from localStorage')
      
      // Reset auth state immediately
      setIsAuthenticated(false)
      setHasCredentials(false)
      console.log('✅ Auth state reset')
      
      // Optional: Call backend logout endpoint if you have one
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
        console.log('🔄 Backend logout call completed')
      } catch (error) {
        console.log('⚠️ Backend logout call failed (non-critical):', error)
      }
      
      // Force redirect to home page root
      console.log('🏠 Redirecting to home page...')
      window.location.replace('/')
      
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Fallback: still try to redirect even if logout fails
      window.location.replace('/')
    }
  }

  const getDestinationUrl = () => {
    if (!isAuthenticated) return null
    
    // If user has credentials, go to dashboard
    // If not, go to setup page
    return hasCredentials ? "/dashboard" : "/setup"
  }

  const getButtonText = () => {
    if (!isAuthenticated) return "Get Started"
    return hasCredentials ? "Go to Dashboard" : "Complete Setup"
  }

  const getHeroButtonText = () => {
    if (isLoading) return "Starting..."
    if (!isAuthenticated) return "Start Trading Now"
    return hasCredentials ? "Go to Dashboard" : "Complete Setup"
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">IIFL Trading</span>
          </div>
          <div className="space-x-4">
            {authLoading ? (
              <div className="w-20 h-10 bg-gray-200 animate-pulse rounded"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href={getDestinationUrl()!}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {getButtonText()}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Login</span>
                    </div>
                  )}
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Get Started"}
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Trade Smarter with <span className="text-blue-600">IIFL Trading</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect your IIFL account securely and access powerful trading tools, real-time market data, and portfolio
            management in one unified platform.
          </p>
          {authLoading ? (
            <div className="w-48 h-14 bg-gray-200 animate-pulse rounded mx-auto"></div>
          ) : isAuthenticated ? (
            <Link href={getDestinationUrl()!}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                {getButtonText()}
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {getHeroButtonText()}
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Login with Google and securely connect your IIFL trading account with encrypted API key storage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access live market data, portfolio updates, and trading positions directly from your IIFL account.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive portfolio analysis, performance tracking, and trading insights to optimize your
                investments.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Sign in with Google</h3>
              <p className="text-gray-600">
                Authenticate securely using your Google account for quick and safe access.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Connect IIFL Account</h3>
              <p className="text-gray-600">Provide your IIFL API credentials to establish a secure connection.</p>
              <a 
                href="https://api.iiflsecurities.com/api-keys.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm inline-block mt-2"
              >
                Get your API keys here →
              </a>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Trading</h3>
              <p className="text-gray-600">Access your portfolio, market data, and trading tools in one dashboard.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 IIFL Trading Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}