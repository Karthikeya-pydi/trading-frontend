"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Loader2, CheckCircle, Eye, EyeOff, ExternalLink } from "lucide-react"
import { API_ENDPOINTS, LOCAL_STORAGE_KEYS } from "@/constants"
import { ApiClient } from "@/services/api-client.service"
import { Layout } from "@/components/layout/Layout"

interface IIFLCredentials {
  user_id: string
  interactive_api_key: string
  interactive_secret_key: string
  market_api_key: string
  market_secret_key: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showInteractiveSecret, setShowInteractiveSecret] = useState(false)
  const [showMarketSecret, setShowMarketSecret] = useState(false)
  
  const [credentials, setCredentials] = useState<IIFLCredentials>({
    user_id: "",
    interactive_api_key: "",
    interactive_secret_key: "",
    market_api_key: "",
    market_secret_key: ""
  })

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
    if (!token) {
      router.push('/login')
    }
  }, [router])

  // Fetch existing credentials (if available)
  useEffect(() => {
    const fetchExistingCredentials = async () => {
      setIsFetching(true)
      try {
        // Try to get user profile - credentials might be partially returned
        // Note: Backend may not return credentials for security, so we handle gracefully
        const result = await ApiClient.get(API_ENDPOINTS.USER_PROFILE)
        if (result.data) {
          // If backend returns credentials, populate them
          // Otherwise, fields will remain empty and user can fill them
          if (result.data.user_id) {
            setCredentials(prev => ({
              ...prev,
              user_id: result.data.user_id || ""
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching credentials:', err)
        // Silent fail - user can still update credentials
      } finally {
        setIsFetching(false)
      }
    }

    fetchExistingCredentials()
  }, [])

  const handleInputChange = (field: keyof IIFLCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
    setError("")
    setSuccess("")
  }

  const validateCredentials = async () => {
    setIsValidating(true)
    setError("")
    setSuccess("")

    try {
      const result = await ApiClient.post(API_ENDPOINTS.IIFL_VALIDATE_CREDENTIALS, {
        user_id: credentials.user_id,
        interactive_api_key: credentials.interactive_api_key,
        interactive_secret_key: credentials.interactive_secret_key,
        market_api_key: credentials.market_api_key,
        market_secret_key: credentials.market_secret_key
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess('Credentials validated successfully!')
    } catch (err) {
      console.error('Validation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate credentials')
    } finally {
      setIsValidating(false)
    }
  }

  const saveCredentials = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Save Interactive credentials
      const interactiveResult = await ApiClient.post(API_ENDPOINTS.IIFL_INTERACTIVE_CREDENTIALS, {
        user_id: credentials.user_id,
        api_key: credentials.interactive_api_key,
        secret_key: credentials.interactive_secret_key
      })

      if (interactiveResult.error) {
        throw new Error(interactiveResult.error)
      }

      // Save Market credentials
      const marketResult = await ApiClient.post(API_ENDPOINTS.IIFL_MARKET_CREDENTIALS, {
        user_id: credentials.user_id,
        api_key: credentials.market_api_key,
        secret_key: credentials.market_secret_key
      })

      if (marketResult.error) {
        throw new Error(marketResult.error)
      }

      setSuccess('API keys updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)

    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return credentials.user_id.trim() !== '' &&
           credentials.interactive_api_key.trim() !== '' &&
           credentials.interactive_secret_key.trim() !== '' &&
           credentials.market_api_key.trim() !== '' &&
           credentials.market_secret_key.trim() !== ''
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your API keys and account settings</p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">IIFL API Credentials</CardTitle>
            <CardDescription>
              Update your IIFL API credentials for both Interactive and Market data access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isFetching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            )}

            {!isFetching && (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* User ID */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user_id">IIFL User ID</Label>
                    <Input
                      id="user_id"
                      type="text"
                      placeholder="Enter your IIFL User ID"
                      value={credentials.user_id}
                      onChange={(e) => handleInputChange('user_id', e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Your IIFL account user ID (usually your registered mobile number or email)
                    </p>
                  </div>
                </div>

                {/* Interactive API Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Interactive API</h3>
                    <a
                      href="https://api.iiflsecurities.com/api-keys.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                    >
                      <span>Get API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interactive_api_key">API Key</Label>
                      <Input
                        id="interactive_api_key"
                        type="text"
                        placeholder="Enter Interactive API Key"
                        value={credentials.interactive_api_key}
                        onChange={(e) => handleInputChange('interactive_api_key', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interactive_secret_key">Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="interactive_secret_key"
                          type={showInteractiveSecret ? "text" : "password"}
                          placeholder="Enter Interactive Secret Key"
                          value={credentials.interactive_secret_key}
                          onChange={(e) => handleInputChange('interactive_secret_key', e.target.value)}
                          className="font-mono text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowInteractiveSecret(!showInteractiveSecret)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showInteractiveSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market API Credentials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Market API</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="market_api_key">API Key</Label>
                      <Input
                        id="market_api_key"
                        type="text"
                        placeholder="Enter Market API Key"
                        value={credentials.market_api_key}
                        onChange={(e) => handleInputChange('market_api_key', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="market_secret_key">Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="market_secret_key"
                          type={showMarketSecret ? "text" : "password"}
                          placeholder="Enter Market Secret Key"
                          value={credentials.market_secret_key}
                          onChange={(e) => handleInputChange('market_secret_key', e.target.value)}
                          className="font-mono text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMarketSecret(!showMarketSecret)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showMarketSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={validateCredentials}
                    disabled={!isFormValid() || isValidating || isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Validate Credentials'
                    )}
                  </Button>
                  
                  <Button
                    onClick={saveCredentials}
                    disabled={!isFormValid() || isLoading || isValidating}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Update API Keys'
                    )}
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Updating your API keys will replace your existing credentials</li>
                    <li>• Keep your secret keys secure and never share them publicly</li>
                    <li>• You can validate credentials before saving to ensure they work correctly</li>
                    <li>• Changes take effect immediately after saving</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

