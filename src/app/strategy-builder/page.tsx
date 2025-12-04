'use client'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OptionChainTable } from '@/components/strategy-builder/OptionChainTable'
import { StrategyTemplates } from '@/components/strategy-builder/StrategyTemplates'
import { StrategyPnLDisplay } from '@/components/strategy-builder/StrategyPnLDisplay'
import { PositionManager } from '@/components/strategy-builder/PositionManager'
import { StrategyBuilderService } from '@/services/strategy-builder.service'
import { useStrategyBuilderWebSocket } from '@/hooks/useStrategyBuilderWebSocket'
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type {
  Underlying,
  OptionChain,
  Strategy,
  OptionData,
  StrategyPnLMessage,
} from '@/types/strategy-builder'

export default function StrategyBuilderPage() {
  const [underlyingList, setUnderlyingList] = useState<Underlying[]>([])
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>('')
  const [expiryDates, setExpiryDates] = useState<string[]>([])
  const [selectedExpiry, setSelectedExpiry] = useState<string>('')
  const [optionChain, setOptionChain] = useState<OptionChain | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load underlying list on mount
  useEffect(() => {
    loadUnderlyingList()
    loadStrategies()
  }, [])

  // Load expiry dates when underlying changes
  useEffect(() => {
    if (selectedUnderlying) {
      loadExpiryDates()
    }
  }, [selectedUnderlying])

  // Load option chain when expiry is selected
  useEffect(() => {
    if (selectedUnderlying && selectedExpiry) {
      loadOptionChain()
    }
  }, [selectedUnderlying, selectedExpiry])

  // Subscribe to strategy updates via WebSocket
  const { isConnected: wsConnected, error: wsError } = useStrategyBuilderWebSocket({
    strategyId: selectedStrategy?.strategy_id,
    onStrategyUpdate: (data) => {
      if (selectedStrategy && data.strategy_id === selectedStrategy.strategy_id) {
        setSelectedStrategy({
          ...selectedStrategy,
          positions: data.positions,
          total_pnl: data.total_pnl,
        })
      }
      // Update in strategies list too
      setStrategies((prev) =>
        Array.isArray(prev)
          ? prev.map((s) =>
              s.strategy_id === data.strategy_id
                ? { ...s, positions: data.positions, total_pnl: data.total_pnl }
                : s
            )
          : []
      )
    },
    onError: (err) => {
      // Only show WebSocket errors in console, not as user-facing errors
      // since WebSocket is optional for basic functionality
      console.warn('WebSocket error (non-critical):', err)
    },
  })

  const loadUnderlyingList = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading underlying list...')
      const list = await StrategyBuilderService.getUnderlyingList('NSEFO')
      console.log('Received underlying list:', list)
      const safeList = Array.isArray(list) ? list : []
      console.log(`Setting ${safeList.length} underlying items`)
      setUnderlyingList(safeList)
      if (safeList.length > 0 && !selectedUnderlying) {
        console.log('Setting first underlying:', safeList[0].underlying)
        setSelectedUnderlying(safeList[0].underlying)
      } else if (safeList.length === 0) {
        console.warn('No underlying items found')
      }
    } catch (err) {
      console.error('Error loading underlying list:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to load underlying list'
      setError(errorMsg)
      setUnderlyingList([]) // Ensure it's always an array
    } finally {
      setLoading(false)
    }
  }

  const loadExpiryDates = async () => {
    if (!selectedUnderlying) return
    try {
      setLoading(true)
      setError(null)
      const dates = await StrategyBuilderService.getExpiryDates(selectedUnderlying, 'NSEFO')
      const safeDates = Array.isArray(dates) ? dates : []
      setExpiryDates(safeDates.map((d) => d.expiry_date))
      if (safeDates.length > 0 && !selectedExpiry) {
        setSelectedExpiry(safeDates[0].expiry_date)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expiry dates')
      setExpiryDates([]) // Ensure it's always an array
    } finally {
      setLoading(false)
    }
  }

  const loadOptionChain = async () => {
    if (!selectedUnderlying || !selectedExpiry) return
    try {
      setLoading(true)
      setError(null)
      const chain = await StrategyBuilderService.getOptionChain(selectedUnderlying, selectedExpiry)
      setOptionChain(chain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load option chain')
    } finally {
      setLoading(false)
    }
  }

  const loadStrategies = async () => {
    try {
      const list = await StrategyBuilderService.getAllStrategies()
      setStrategies(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load strategies:', err)
      setStrategies([]) // Ensure it's always an array
    }
  }

  const handleCreateStrategy = async (type: string, params: any) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      let strategy: Strategy
      if (type === 'straddle') {
        strategy = await StrategyBuilderService.createStraddle(params)
      } else if (type === 'strangle') {
        strategy = await StrategyBuilderService.createStrangle(
          params.underlying,
          params.expiry_date,
          params.ce_strike,
          params.pe_strike,
          params.quantity
        )
      } else {
        strategy = await StrategyBuilderService.createStrategy({
          strategy_name: `Custom Strategy - ${new Date().toLocaleString()}`,
          underlying: params.underlying || selectedUnderlying,
          expiry_date: params.expiry_date || selectedExpiry,
          strategy_type: type as any,
        })
      }

      setStrategies((prev) => (Array.isArray(prev) ? [...prev, strategy] : [strategy]))
      setSelectedStrategy(strategy)
      setSuccess(`Strategy "${strategy.strategy_name}" created successfully!`)
      
      // Subscribe to strategy updates
      try {
        await StrategyBuilderService.subscribeStrategy(strategy.strategy_id)
      } catch (err) {
        // Non-critical error, just log it
        console.warn('Failed to subscribe to strategy updates:', err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create strategy')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = useCallback(
    (option: OptionData, strike: number, optionType: 'CE' | 'PE') => {
      const key = `${strike}-${optionType}`
      const newSelected = new Set(selectedOptions)
      
      if (newSelected.has(key)) {
        newSelected.delete(key)
      } else {
        newSelected.add(key)
      }
      
      setSelectedOptions(newSelected)
    },
    [selectedOptions]
  )

  const handleStrategySelect = (strategyId: string) => {
    const strategy = strategies.find((s) => s.strategy_id === strategyId)
    if (strategy) {
      setSelectedStrategy(strategy)
      StrategyBuilderService.subscribeStrategy(strategy.strategy_id)
    }
  }

  const handleStrategyUpdate = async (updatedStrategy: Strategy) => {
    setSelectedStrategy(updatedStrategy)
    setStrategies((prev) =>
      Array.isArray(prev)
        ? prev.map((s) => (s.strategy_id === updatedStrategy.strategy_id ? updatedStrategy : s))
        : [updatedStrategy]
    )
  }

  return (
    <Layout title="Strategy Builder">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Strategy Builder</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Build and manage options strategies with real-time P&L tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                wsConnected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {wsConnected ? '🟢 Live' : '⚪ Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadOptionChain}
              disabled={loading || !selectedUnderlying || !selectedExpiry}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Select Underlying & Expiry</CardTitle>
            <CardDescription>Choose the underlying asset and expiry date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="underlying">Underlying</Label>
                <Select
                  value={selectedUnderlying}
                  onValueChange={setSelectedUnderlying}
                  disabled={loading}
                >
                  <SelectTrigger id="underlying" className="mt-1">
                    <SelectValue placeholder="Select underlying" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(underlyingList) && underlyingList.length > 0 ? (
                      underlyingList.map((item) => (
                        <SelectItem key={item.underlying} value={item.underlying}>
                          {item.underlying}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {loading ? 'Loading...' : 'No underlying found'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Select
                  value={selectedExpiry}
                  onValueChange={setSelectedExpiry}
                  disabled={loading || !selectedUnderlying}
                >
                  <SelectTrigger id="expiry" className="mt-1">
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(expiryDates) && expiryDates.length > 0 ? (
                      expiryDates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {date}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {loading ? 'Loading...' : 'No expiry dates found'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="chain" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chain">Option Chain</TabsTrigger>
            <TabsTrigger value="strategies">My Strategies</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Option Chain Tab */}
          <TabsContent value="chain" className="space-y-4">
            {optionChain ? (
              <>
                <OptionChainTable
                  optionChain={optionChain}
                  onOptionSelect={handleOptionSelect}
                  selectedOptions={selectedOptions}
                  spotPrice={optionChain.spot_price}
                />
                {selectedOptions.size > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Options ({selectedOptions.size})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedOptions).map((key) => {
                          const [strike, type] = key.split('-')
                          return (
                            <Badge key={key} variant="outline" className="text-sm">
                              {strike} {type}
                            </Badge>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                      <p className="text-gray-600">Loading option chain...</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Select an underlying and expiry date to view the option chain
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Strategies List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>My Strategies</CardTitle>
                    <CardDescription>{strategies.length} strategies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {!Array.isArray(strategies) || strategies.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No strategies yet. Create one using templates!
                        </p>
                      ) : (
                        strategies.map((strategy) => (
                          <div
                            key={strategy.strategy_id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedStrategy?.strategy_id === strategy.strategy_id
                                ? 'bg-teal-50 border-teal-500'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleStrategySelect(strategy.strategy_id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">{strategy.strategy_name}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {strategy.strategy_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              {strategy.underlying} • {strategy.expiry_date}
                            </div>
                            {strategy.total_pnl !== undefined && (
                              <div
                                className={`text-sm font-semibold mt-1 ${
                                  strategy.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                P&L: ₹{strategy.total_pnl.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategy Details */}
              <div className="lg:col-span-2 space-y-4">
                {selectedStrategy ? (
                  <>
                    <StrategyPnLDisplay strategy={selectedStrategy} />
                    <PositionManager
                      strategy={selectedStrategy}
                      onUpdate={handleStrategyUpdate}
                      loading={loading}
                    />
                  </>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <p className="text-gray-500">Select a strategy to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {optionChain ? (
              <StrategyTemplates
                underlying={selectedUnderlying}
                expiryDate={selectedExpiry}
                optionChain={optionChain}
                spotPrice={optionChain.spot_price}
                onCreateStrategy={handleCreateStrategy}
                loading={loading}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-500">
                    Select an underlying and expiry date to use strategy templates
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

