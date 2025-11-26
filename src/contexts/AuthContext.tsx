'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AuthService } from '@/services/auth.service'
import { LOCAL_STORAGE_KEYS } from '@/constants'
import type { User, AuthState } from '@/types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN)
        if (storedToken) {
          setToken(storedToken)
          // Validate token and get user
          const userData = await AuthService.validateToken()
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear invalid token
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: userData, token: newToken } = await AuthService.login(email, password)
      setUser(userData)
      setToken(newToken)
      setIsAuthenticated(true)
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newToken)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    AuthService.logout()
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await AuthService.getUserProfile()
      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      // If refresh fails, user might be logged out
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUser,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

