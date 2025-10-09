"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Loader2 } from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS } from "@/constants"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Handle OAuth error from callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      setError('Authentication failed. Please try again.')
    }
  }, [])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Redirect to backend Google OAuth endpoint with callback URL
      const FRONTEND_URL = window.location.origin
      const callbackUrl = `${FRONTEND_URL}/auth/callback`
      
      const oauthUrl = `${API_BASE_URL}${API_ENDPOINTS.GOOGLE_OAUTH}?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(callbackUrl)}`
      
      console.log('🚀 Starting Google OAuth...')
      console.log('📍 Frontend URL:', FRONTEND_URL)  
      console.log('🔙 Callback URL:', callbackUrl)
      console.log('🌐 OAuth URL:', oauthUrl)
      
      window.location.href = oauthUrl
    } catch (error) {
      console.error("Login failed:", error)
      setError('Failed to start authentication. Please try again.')
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-3 sm:px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">IIFL Trading</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Sign in to your trading account</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-center text-gray-600 text-sm sm:text-base">
              Sign in with your Google account to access your trading dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>



            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                By continuing, you agree to our{" "}
                <button
                  type="button"
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
