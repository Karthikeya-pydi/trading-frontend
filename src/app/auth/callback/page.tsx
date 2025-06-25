"use client"

import { useEffect, useState } from "react"

export default function AuthCallback() {
  const [status, setStatus] = useState("Processing login...")

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const error = urlParams.get('error')
    
    console.log('OAuth callback received:', { 
      token: token ? `${token.substring(0, 20)}...` : null, 
      error,
      fullUrl: window.location.href 
    })

    if (token) {
      // Store the token
      localStorage.setItem('token', token)
      console.log('OAuth successful, token stored')
      
      // Check if user already has API credentials
      checkUserCredentials(token)
    } else if (error) {
      console.error('OAuth error:', error)
      
      // Redirect back to login with error immediately
      window.location.href = `/login?error=${encodeURIComponent(error)}`
    } else {
      // No token or error, redirect to login immediately
      console.log('No token received, redirecting to login immediately')
      window.location.href = "/login"
    }
  }, [])

  const checkUserCredentials = async (token: string) => {
    try {
      setStatus("Checking your account setup...")
      
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
        
        // Check if user has either market or interactive credentials
        const hasCredentials = user.has_iifl_market_credentials || user.has_iifl_interactive_credentials
        
        if (hasCredentials) {
          console.log('User has existing credentials, redirecting to dashboard')
          setStatus("Welcome back! Redirecting to dashboard...")
          window.location.href = "/dashboard"
        } else {
          console.log('First-time user, redirecting to setup')
          setStatus("Setting up your account...")
          window.location.href = "/setup"
        }
      } else {
        // If check fails, assume first-time setup needed
        console.log('Could not check credentials, redirecting to setup')
        setStatus("Setting up your account...")
        window.location.href = "/setup"
      }
    } catch (error) {
      console.error('Error checking credentials:', error)
      // If check fails, assume first-time setup needed
      setStatus("Setting up your account...")
      window.location.href = "/setup"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
} 