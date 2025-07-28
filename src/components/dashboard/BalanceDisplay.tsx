"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { TradingService } from "@/services/trading.service"
import { BalanceResponse } from "@/types"

interface BalanceDisplayProps {
  className?: string
}

export function BalanceDisplay({ className }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    setLoading(true)
    setError(null)
    try {
      const balanceData = await TradingService.getBalance()
      setBalance(balanceData)
    } catch (err) {
      console.error("Error fetching balance:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch balance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    
    // Auto-refresh balance every 30 seconds
    const interval = setInterval(() => {
      fetchBalance()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return "₹0"
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue)
  }

  const getBalanceData = () => {
    if (!balance?.balance?.result?.BalanceList?.[0]?.limitObject) {
      return null
    }

    const balanceData = balance.balance.result.BalanceList[0].limitObject
    return {
      cashAvailable: parseFloat(balanceData.RMSSubLimits.cashAvailable) || 0,
      netMarginAvailable: parseFloat(balanceData.RMSSubLimits.netMarginAvailable) || 0,
      marginUtilized: parseFloat(balanceData.RMSSubLimits.marginUtilized) || 0,
      cashMarginAvailable: parseFloat(balanceData.marginAvailable.CashMarginAvailable) || 0,
      accountId: balanceData.AccountID,
      mtm: parseFloat(balanceData.RMSSubLimits.MTM) || 0,
      unrealizedMtm: parseFloat(balanceData.RMSSubLimits.UnrealizedMTM) || 0,
      realizedMtm: parseFloat(balanceData.RMSSubLimits.RealizedMTM) || 0,
    }
  }

  const balanceData = getBalanceData()

  if (error) {
    return (
      <Card className={`bg-red-900/20 border-red-700 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-300">Balance Error</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchBalance}
              disabled={loading}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!balanceData) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-slate-400" />
              <div>
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-700 rounded animate-pulse mt-1"></div>
              </div>
            </div>
            <RefreshCw className={`h-3 w-3 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-blue-400" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(balanceData.cashAvailable)}
                  </span>
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700 text-xs hidden sm:inline">
                    {balanceData.accountId}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span className="hidden md:inline">Margin: {formatCurrency(balanceData.netMarginAvailable)}</span>
                  <span className="hidden sm:inline">Used: {formatCurrency(balanceData.marginUtilized)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {balanceData.mtm !== 0 && (
              <div className="flex items-center space-x-1">
                {balanceData.mtm > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs font-medium hidden sm:inline ${
                  balanceData.mtm > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(balanceData.mtm)}
                </span>
              </div>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchBalance}
              disabled={loading}
              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-300"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 