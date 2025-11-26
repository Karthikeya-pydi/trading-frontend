'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { TradingProvider } from '@/contexts/TradingContext'
import { PortfolioProvider } from '@/contexts/PortfolioContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TradingProvider>
        <PortfolioProvider>
          {children}
        </PortfolioProvider>
      </TradingProvider>
    </AuthProvider>
  )
}

