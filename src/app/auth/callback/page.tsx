"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Loader2, CheckCircle, XCircle } from "lucide-react"
import { API_BASE_URL, API_ENDPOINTS, LOCAL_STORAGE_KEYS } from "@/constants"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const error = searchParams.get('error')

        if (error) {
          console.error('OAuth error:', error)
          setStatus('error')
          
          setMessage('Authentication failed. Please try again.')
          return
        }

        if (accessToken) {
          // Store both tokens using constants
          localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, accessToken)
          if (refreshToken) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
          }
          console.log('✅ Tokens stored successfully')
          
          setStatus('success')
          setMessage('Authentication successful! Checking setup...')
          
          // Check if user needs setup
          try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
              headers: { 
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json" 
              },
            })
            
            if (response.ok) {
              const user = await response.json()
              
              if (user.has_iifl_market_credentials || user.has_iifl_interactive_credentials) {
                // User has credentials, go to dashboard
                setMessage('Setup complete! Redirecting to dashboard...')
                setTimeout(() => {
                  router.push('/dashboard')
                }, 1500)
              } else {
                // User needs setup
                setMessage('First time setup required! Redirecting to setup...')
                setTimeout(() => {
                  router.push('/setup')
                }, 1500)
              }
            } else {
              // User needs setup
              setMessage('First time setup required! Redirecting to setup...')
              setTimeout(() => {
                router.push('/setup')
              }, 1500)
            }
          } catch (error) {
            console.error('Error checking setup status:', error)
            // Default to setup page for first-time users
            setMessage('First time setup required! Redirecting to setup...')
            setTimeout(() => {
              router.push('/setup')
            }, 1500)
          }
        } else {
          setStatus('error')
          setMessage('No authentication token received.')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage('An error occurred during authentication.')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">IIFL Trading</span>
          </div>
        </div>

        {/* Status Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {status === 'loading' && 'Please wait while we complete your sign-in'}
              {status === 'success' && 'You have been successfully authenticated'}
              {status === 'error' && 'There was an issue with your authentication'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              {status === 'loading' && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>

            {status === 'error' && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full h-11 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium transition-all duration-200 rounded-md"
                >
                  Try Again
                </button>
                

              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">IIFL Trading</span>
          </div>
        </div>
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
} 