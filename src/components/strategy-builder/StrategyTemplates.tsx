'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Target, Zap, TrendingUp, BarChart3 } from 'lucide-react'
import type { OptionChain } from '@/types/strategy-builder'

interface StrategyTemplatesProps {
  underlying: string
  expiryDate: string
  optionChain: OptionChain
  spotPrice: number
  onCreateStrategy: (type: string, params: any) => Promise<void>
  loading?: boolean
}

export function StrategyTemplates({
  underlying,
  expiryDate,
  optionChain,
  spotPrice,
  onCreateStrategy,
  loading = false,
}: StrategyTemplatesProps) {
  const [straddleStrike, setStraddleStrike] = useState<number>(Math.round(spotPrice / 50) * 50)
  const [straddleQuantity, setStraddleQuantity] = useState(50)

  const [strangleCeStrike, setStrangleCeStrike] = useState<number>(
    Math.round(spotPrice / 50) * 50 + 200
  )
  const [stranglePeStrike, setStranglePeStrike] = useState<number>(
    Math.round(spotPrice / 50) * 50 - 200
  )
  const [strangleQuantity, setStrangleQuantity] = useState(50)

  // Find available strikes
  const availableStrikes = Array.isArray(optionChain.option_chain)
    ? optionChain.option_chain.map((item) => item.strike).sort((a, b) => a - b)
    : []
  const atmStrike =
    availableStrikes.length > 0
      ? availableStrikes.reduce((closest, strike) => {
          return Math.abs(strike - spotPrice) < Math.abs(closest - spotPrice) ? strike : closest
        }, availableStrikes[0])
      : Math.round(spotPrice / 50) * 50

  const handleCreateStraddle = async () => {
    await onCreateStrategy('straddle', {
      underlying,
      expiry_date: expiryDate,
      strike: straddleStrike,
      quantity: straddleQuantity,
    })
  }

  const handleCreateStrangle = async () => {
    await onCreateStrategy('strangle', {
      underlying,
      expiry_date: expiryDate,
      ce_strike: strangleCeStrike,
      pe_strike: stranglePeStrike,
      quantity: strangleQuantity,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Straddle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            <CardTitle>Straddle</CardTitle>
          </div>
          <CardDescription>
            Buy/sell both call and put at the same strike price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="straddle-strike">Strike Price</Label>
            <Input
              id="straddle-strike"
              type="number"
              value={straddleStrike}
              onChange={(e) => setStraddleStrike(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStraddleStrike(atmStrike)}
                className="text-xs"
              >
                Use ATM
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="straddle-quantity">Quantity</Label>
            <Input
              id="straddle-quantity"
              type="number"
              value={straddleQuantity}
              onChange={(e) => setStraddleQuantity(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleCreateStraddle}
            disabled={loading || !straddleStrike || !straddleQuantity}
            className="w-full"
          >
            Create Straddle
          </Button>
        </CardContent>
      </Card>

      {/* Strangle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <CardTitle>Strangle</CardTitle>
          </div>
          <CardDescription>
            Buy/sell call and put at different strike prices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="strangle-ce-strike">CE Strike</Label>
              <Input
                id="strangle-ce-strike"
                type="number"
                value={strangleCeStrike}
                onChange={(e) => setStrangleCeStrike(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="strangle-pe-strike">PE Strike</Label>
              <Input
                id="strangle-pe-strike"
                type="number"
                value={stranglePeStrike}
                onChange={(e) => setStranglePeStrike(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="strangle-quantity">Quantity</Label>
            <Input
              id="strangle-quantity"
              type="number"
              value={strangleQuantity}
              onChange={(e) => setStrangleQuantity(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleCreateStrangle}
            disabled={loading || !strangleCeStrike || !stranglePeStrike || !strangleQuantity}
            className="w-full"
          >
            Create Strangle
          </Button>
        </CardContent>
      </Card>

      {/* Custom Strategy */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <CardTitle>Custom Strategy</CardTitle>
          </div>
          <CardDescription>
            Build your own strategy by selecting options from the chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Select options from the option chain table to build a custom strategy. Click on any CE or
            PE option to add it to your strategy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

