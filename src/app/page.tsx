"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

export default function HomePage() {
  const router = useRouter()

  // No automatic redirects - users must explicitly click Sign In/Get Started

  const handleSignInClick = () => {
    // Sign In always goes to login page
    router.push('/login')
  }

  const handleGetStartedClick = () => {
    // Always go to login page for new users
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">IIFL Trading</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                onClick={handleSignInClick}
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-3 sm:px-4"
              >
                Sign In
              </Button>
              <Button
                onClick={handleSignInClick}
                size="sm"
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-xs sm:text-sm px-3 sm:px-4 hidden sm:inline-flex"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Professional Trading Platform
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Advanced trading tools with IIFL integration. Real-time market data, 
            portfolio management, and seamless order execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button
              onClick={handleGetStartedClick}
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
            >
              Start Trading
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSignInClick}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose IIFL Trading?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Professional-grade trading tools designed for serious investors
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-3 sm:mb-4">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Real-time Data</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Get live market quotes, order book data, and real-time portfolio updates
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-3 sm:mb-4">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Secure Trading</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Bank-grade security with encrypted connections and secure API integration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-3 sm:mb-4">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Comprehensive portfolio analysis, risk metrics, and performance tracking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="text-center px-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Sign in with Google</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Authenticate securely using your Google account for quick and safe access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center px-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Connect IIFL Account</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Provide your IIFL API credentials to establish a secure connection.
              </p>
              <a 
                href="https://api.iiflsecurities.com/api-keys.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-teal-600 hover:text-teal-700 font-medium text-sm sm:text-base"
              >
                Get your API keys here →
              </a>
            </div>

            {/* Step 3 */}
            <div className="text-center px-4 sm:col-span-2 md:col-span-1">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Start Trading</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Access your portfolio, market data, and trading tools in one dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-3 sm:px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">IIFL Trading</span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Professional trading platform with advanced features
          </p>
        </div>
      </footer>
    </div>
  )
}