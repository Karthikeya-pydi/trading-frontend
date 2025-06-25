"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, EyeOff, Shield, Key, BarChart3, Activity, CheckCircle } from "lucide-react"
import Link from "next/link"

type SetupStep = "interactive" | "market" | "complete"

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState<SetupStep>("interactive")
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    // Interactive API credentials
    interactive_api_key: "",
    interactive_secret_key: "",
    interactive_user_id: "",
    // Market API credentials
    market_api_key: "",
    market_secret_key: "",
    market_user_id: "",
  })
  
  const [showSecrets, setShowSecrets] = useState({
    interactive_secret_key: false,
    market_secret_key: false,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('No token found, redirecting to login')
      window.location.href = "/login"
      return
    }
    console.log('User authenticated, checking existing setup')
    checkExistingCredentials()
  }, [])

  const checkExistingCredentials = async () => {
    try {
      const token = localStorage.getItem('token')
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
        
        // Check which credentials are already configured
        const newCompletedSteps = new Set<string>()
        
        if (user.has_iifl_interactive_credentials) {
          newCompletedSteps.add("interactive")
        }
        
        if (user.has_iifl_market_credentials) {
          newCompletedSteps.add("market")
        }
        
        setCompletedSteps(newCompletedSteps)
        
        // If both are completed, user can go to dashboard
        if (user.has_iifl_interactive_credentials && user.has_iifl_market_credentials) {
          setCurrentStep("complete")
        } else if (user.has_iifl_interactive_credentials) {
          setCurrentStep("market")
        }
        
        setError("") // Clear any errors
        console.log('Existing credentials checked')
      }
    } catch (error) {
      console.log('Could not check existing credentials:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const toggleVisibility = (field: "interactive_secret_key" | "market_secret_key") => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleStepSubmit = async (apiType: "interactive" | "market") => {
    setIsLoading(true)
    setError("")

    try {
      // Validate required fields based on API type
      if (apiType === "interactive") {
        if (!formData.interactive_api_key || !formData.interactive_secret_key || !formData.interactive_user_id) {
          throw new Error("All Interactive API fields are required")
        }
      } else if (apiType === "market") {
        if (!formData.market_api_key || !formData.market_secret_key || !formData.market_user_id) {
          throw new Error("All Market API fields are required")
        }
      }

      // Prepare payload based on API type
      const payload = {
        api_type: apiType,
        api_key: apiType === "interactive" ? formData.interactive_api_key : formData.market_api_key,
        secret_key: apiType === "interactive" ? formData.interactive_secret_key : formData.market_secret_key,
        user_id: apiType === "interactive" ? formData.interactive_user_id : formData.market_user_id,
      }

      // Call your backend API to save credentials
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/users/set-iifl-credentials`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save API keys. Please check your credentials.")
      }

      const result = await response.json()
      console.log(`${apiType} API keys saved successfully:`, result)

      // Mark step as completed
      setCompletedSteps(prev => new Set([...prev, apiType]))

      // Move to next step
      if (apiType === "interactive") {
        setCurrentStep("market")
      } else if (apiType === "market") {
        setCurrentStep("complete")
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to connect ${apiType} API. Please check your credentials.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSetup = () => {
    // Redirect to dashboard on completion
    window.location.href = "/dashboard"
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case "interactive":
        return "Step 1: Interactive API Setup"
      case "market":
        return "Step 2: Market API Setup"
      case "complete":
        return "Setup Complete!"
      default:
        return "API Setup"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case "interactive":
        return "First, configure your Interactive API credentials for trading capabilities"
      case "market":
        return "Now, set up your Market API credentials for market data access"
      case "complete":
        return "Both APIs are configured successfully. You're ready to start trading!"
      default:
        return "Configure your IIFL API credentials"
    }
  }

  const renderProgressSteps = () => (
    <div className="flex items-center justify-center mb-8 space-x-4">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completedSteps.has("interactive") 
            ? "bg-green-600 text-white" 
            : currentStep === "interactive" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-300 text-gray-600"
        }`}>
          {completedSteps.has("interactive") ? <CheckCircle className="h-4 w-4" /> : "1"}
        </div>
        <span className={`text-sm font-medium ${
          currentStep === "interactive" ? "text-blue-600" : completedSteps.has("interactive") ? "text-green-600" : "text-gray-500"
        }`}>
          Interactive
        </span>
      </div>
      
      <div className={`w-12 h-0.5 ${completedSteps.has("interactive") ? "bg-green-600" : "bg-gray-300"}`} />
      
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completedSteps.has("market") 
            ? "bg-green-600 text-white" 
            : currentStep === "market" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-300 text-gray-600"
        }`}>
          {completedSteps.has("market") ? <CheckCircle className="h-4 w-4" /> : "2"}
        </div>
        <span className={`text-sm font-medium ${
          currentStep === "market" ? "text-blue-600" : completedSteps.has("market") ? "text-green-600" : "text-gray-500"
        }`}>
          Market
        </span>
      </div>
      
      <div className={`w-12 h-0.5 ${completedSteps.has("market") ? "bg-green-600" : "bg-gray-300"}`} />
      
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "complete" 
            ? "bg-green-600 text-white" 
            : "bg-gray-300 text-gray-600"
        }`}>
          {currentStep === "complete" ? <CheckCircle className="h-4 w-4" /> : "3"}
        </div>
        <span className={`text-sm font-medium ${
          currentStep === "complete" ? "text-green-600" : "text-gray-500"
        }`}>
          Complete
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">IIFL Trading</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Connect Your IIFL Account</h1>
          <p className="text-gray-600 mt-2">{getStepDescription()}</p>
        </div>

        {/* Progress Steps */}
        {renderProgressSteps()}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-blue-600" />
              <span>{getStepTitle()}</span>
            </CardTitle>
            <CardDescription>
              {currentStep === "complete" 
                ? "Both your Interactive and Market API credentials have been configured successfully."
                : "Your credentials are encrypted and stored securely."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Interactive API Step */}
            {currentStep === "interactive" && (
              <form onSubmit={(e) => { e.preventDefault(); handleStepSubmit("interactive"); }} className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Interactive API</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Enables full trading capabilities including placing orders, viewing positions, and portfolio management.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interactive_api_key">Interactive API Key *</Label>
                      <Input
                        id="interactive_api_key"
                        type="text"
                        placeholder="Enter your Interactive API Key"
                        value={formData.interactive_api_key}
                        onChange={(e) => handleInputChange("interactive_api_key", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interactive_user_id">Interactive User ID *</Label>
                      <Input
                        id="interactive_user_id"
                        type="text"
                        placeholder="Enter your Interactive User ID"
                        value={formData.interactive_user_id}
                        onChange={(e) => handleInputChange("interactive_user_id", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interactive_secret_key">Interactive Secret Key *</Label>
                    <div className="relative">
                      <Input
                        id="interactive_secret_key"
                        type={showSecrets.interactive_secret_key ? "text" : "password"}
                        placeholder="Enter your Interactive Secret Key"
                        value={formData.interactive_secret_key}
                        onChange={(e) => handleInputChange("interactive_secret_key", e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => toggleVisibility("interactive_secret_key")}
                      >
                        {showSecrets.interactive_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save & Continue"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}

            {/* Market API Step */}
            {currentStep === "market" && (
              <form onSubmit={(e) => { e.preventDefault(); handleStepSubmit("market"); }} className="space-y-6">
                <div className="p-4 bg-green-50 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Market API</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Provides read-only access to market data, quotes, and historical information without trading capabilities.
                  </p>
                </div>

                {completedSteps.has("interactive") && (
                  <div className="p-4 bg-blue-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Interactive API configured successfully</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="market_api_key">Market API Key *</Label>
                      <Input
                        id="market_api_key"
                        type="text"
                        placeholder="Enter your Market API Key"
                        value={formData.market_api_key}
                        onChange={(e) => handleInputChange("market_api_key", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="market_user_id">Market User ID *</Label>
                      <Input
                        id="market_user_id"
                        type="text"
                        placeholder="Enter your Market User ID"
                        value={formData.market_user_id}
                        onChange={(e) => handleInputChange("market_user_id", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="market_secret_key">Market Secret Key *</Label>
                    <div className="relative">
                      <Input
                        id="market_secret_key"
                        type={showSecrets.market_secret_key ? "text" : "password"}
                        placeholder="Enter your Market Secret Key"
                        value={formData.market_secret_key}
                        onChange={(e) => handleInputChange("market_secret_key", e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => toggleVisibility("market_secret_key")}
                      >
                        {showSecrets.market_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save & Continue"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep("interactive")}
                    className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}

            {/* Completion Step */}
            {currentStep === "complete" && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
                  <p className="text-gray-600">
                    Both your Interactive and Market API credentials have been configured successfully. 
                    You can now access all trading and market data features.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Configured</Badge>
                    </div>
                    <h4 className="font-medium text-blue-900">Interactive API</h4>
                    <p className="text-sm text-blue-700">Ready for trading operations</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Configured</Badge>
                    </div>
                    <h4 className="font-medium text-green-900">Market API</h4>
                    <p className="text-sm text-green-700">Ready for market data access</p>
                  </div>
                </div>

                <Button 
                  onClick={handleCompleteSetup}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {currentStep !== "complete" && (
              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Note:</strong> Your credentials are encrypted using industry-standard encryption
                  before being stored. We use these only to authenticate with IIFL APIs and never share them with third
                  parties.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {currentStep !== "complete" && (
          <div className="text-center mt-6 text-sm text-gray-600">
            <p>
              Need help finding your API credentials?{" "}
              <Link href="#" className="text-blue-600 hover:underline">
                View IIFL Setup Guide
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}