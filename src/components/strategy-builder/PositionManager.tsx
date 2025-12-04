'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import type { Strategy, AddPositionRequest } from '@/types/strategy-builder'
import { StrategyBuilderService } from '@/services/strategy-builder.service'

interface PositionManagerProps {
  strategy: Strategy
  onUpdate: (strategy: Strategy) => void
  loading?: boolean
}

export function PositionManager({ strategy, onUpdate, loading = false }: PositionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<AddPositionRequest>({
    instrument_id: 0,
    instrument_name: '',
    option_type: 'CE',
    strike: 0,
    quantity: 0,
    side: 'BUY',
    avg_price: 0,
  })

  const handleAddPosition = async () => {
    try {
      const updatedStrategy = await StrategyBuilderService.addPosition(
        strategy.strategy_id,
        formData
      )
      onUpdate(updatedStrategy)
      setShowAddForm(false)
      setFormData({
        instrument_id: 0,
        instrument_name: '',
        option_type: 'CE',
        strike: 0,
        quantity: 0,
        side: 'BUY',
        avg_price: 0,
      })
    } catch (error) {
      console.error('Error adding position:', error)
      alert(error instanceof Error ? error.message : 'Failed to add position')
    }
  }

  const handleRemovePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to remove this position?')) return

    try {
      await StrategyBuilderService.removePosition(strategy.strategy_id, positionId)
      const updatedStrategy = await StrategyBuilderService.getStrategy(strategy.strategy_id)
      onUpdate(updatedStrategy)
    } catch (error) {
      console.error('Error removing position:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove position')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Positions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instrument-name">Instrument Name</Label>
                <Input
                  id="instrument-name"
                  value={formData.instrument_name}
                  onChange={(e) =>
                    setFormData({ ...formData, instrument_name: e.target.value })
                  }
                  placeholder="e.g., NIFTY 24000 CE"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="instrument-id">Instrument ID</Label>
                <Input
                  id="instrument-id"
                  type="number"
                  value={formData.instrument_id}
                  onChange={(e) =>
                    setFormData({ ...formData, instrument_id: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="option-type">Option Type</Label>
                <Select
                  value={formData.option_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, option_type: value as 'CE' | 'PE' })
                  }
                >
                  <SelectTrigger id="option-type" className="mt-1">
                    <SelectValue placeholder="Select option type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CE">Call (CE)</SelectItem>
                    <SelectItem value="PE">Put (PE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="strike">Strike</Label>
                <Input
                  id="strike"
                  type="number"
                  value={formData.strike}
                  onChange={(e) =>
                    setFormData({ ...formData, strike: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="side">Side</Label>
                <Select
                  value={formData.side}
                  onValueChange={(value) =>
                    setFormData({ ...formData, side: value as 'BUY' | 'SELL' })
                  }
                >
                  <SelectTrigger id="side" className="mt-1">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="avg-price">Average Price</Label>
              <Input
                id="avg-price"
                type="number"
                step="0.01"
                value={formData.avg_price}
                onChange={(e) =>
                  setFormData({ ...formData, avg_price: parseFloat(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddPosition} disabled={loading} className="flex-1">
                Add Position
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!Array.isArray(strategy.positions) || strategy.positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No positions added yet. Click "Add Position" to get started.
            </div>
          ) : (
            strategy.positions.map((position, index) => (
              <div
                key={position.position_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{position.instrument_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        position.side === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {position.side}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {position.option_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    Strike: {position.strike} • Qty: {position.quantity} • Avg: ₹
                    {position.avg_price.toFixed(2)}
                    {position.current_price && (
                      <> • LTP: ₹{position.current_price.toFixed(2)}</>
                    )}
                    {position.unrealized_pnl !== undefined && (
                      <span
                        className={`ml-2 font-semibold ${
                          position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        P&L: ₹{position.unrealized_pnl.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {position.position_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePosition(position.position_id!)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

