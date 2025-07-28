"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">IIFL Trading</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Trading Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced trading tools with IIFL integration. Real-time market data, 
            portfolio management, and seamless order execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/login')}
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 py-3"
            >
              Start Trading
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/login')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose IIFL Trading?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-grade trading tools designed for serious investors
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Data</h3>
                <p className="text-gray-600">
                  Get live market quotes, order book data, and real-time portfolio updates
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Trading</h3>
                <p className="text-gray-600">
                  Bank-grade security with encrypted connections and secure API integration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Comprehensive portfolio analysis, risk metrics, and performance tracking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in with Google</h3>
              <p className="text-gray-600">
                Authenticate securely using your Google account for quick and safe access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect IIFL Account</h3>
              <p className="text-gray-600">
                Provide your IIFL API credentials to establish a secure connection.
              </p>
              <a 
                href="#" 
                className="inline-block mt-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                Get your API keys here →
              </a>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Trading</h3>
              <p className="text-gray-600">
                Access your portfolio, market data, and trading tools in one dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">IIFL Trading</span>
          </div>
          <p className="text-gray-400">
            Professional trading platform with advanced features
          </p>
        </div>
      </footer>
    </div>
  )
}