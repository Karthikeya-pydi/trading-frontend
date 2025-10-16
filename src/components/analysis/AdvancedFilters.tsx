"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter, RotateCcw } from "lucide-react"

export interface AdvancedFilterOptions {
  minReturn1Y?: number
  maxReturn1Y?: number
  minScore?: number
  maxScore?: number
  minTurnover?: number
  minScoreChange3M?: number
  trendDirection?: 'Up' | 'Down' | 'Sideways' | ''
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Very High' | ''
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterOptions
  onUpdate: (filters: AdvancedFilterOptions) => void
  onClose: () => void
}

export function AdvancedFilters({ filters, onUpdate, onClose }: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilterOptions>(filters)

  const handleChange = (key: keyof AdvancedFilterOptions, value: string | number) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
  }

  const handleReset = () => {
    setLocalFilters({})
  }

  const handleApply = () => {
    onUpdate(localFilters)
    onClose()
  }

  const activeFilterCount = Object.values(localFilters).filter(v => v !== undefined && v !== '').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-teal-600" />
                <span>Advanced Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                    {activeFilterCount} active
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Set custom criteria to filter stocks based on multiple parameters
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Returns Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>📈 Returns Filters</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minReturn1Y">Minimum 1Y Return (%)</Label>
                  <Input
                    id="minReturn1Y"
                    type="number"
                    placeholder="e.g., 50"
                    value={localFilters.minReturn1Y || ''}
                    onChange={(e) => handleChange('minReturn1Y', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxReturn1Y">Maximum 1Y Return (%)</Label>
                  <Input
                    id="maxReturn1Y"
                    type="number"
                    placeholder="e.g., 200"
                    value={localFilters.maxReturn1Y || ''}
                    onChange={(e) => handleChange('maxReturn1Y', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Score Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>🎯 Score Filters</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minScore">Minimum Raw Score</Label>
                  <Input
                    id="minScore"
                    type="number"
                    placeholder="e.g., 70"
                    value={localFilters.minScore || ''}
                    onChange={(e) => handleChange('minScore', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Maximum Raw Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    placeholder="e.g., 100"
                    value={localFilters.maxScore || ''}
                    onChange={(e) => handleChange('maxScore', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minScoreChange3M">Minimum Score Change 3M (%)</Label>
                <Input
                  id="minScoreChange3M"
                  type="number"
                  placeholder="e.g., 10"
                  value={localFilters.minScoreChange3M || ''}
                  onChange={(e) => handleChange('minScoreChange3M', parseFloat(e.target.value))}
                />
                <p className="text-xs text-gray-600">Filter stocks with improving scores</p>
              </div>
            </div>

            {/* Liquidity Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>💰 Liquidity Filters</span>
              </h3>
              <div className="space-y-2">
                <Label htmlFor="minTurnover">Minimum Turnover (₹)</Label>
                <Input
                  id="minTurnover"
                  type="number"
                  placeholder="e.g., 10000000"
                  value={localFilters.minTurnover || ''}
                  onChange={(e) => handleChange('minTurnover', parseFloat(e.target.value))}
                />
                <p className="text-xs text-gray-600">Higher turnover indicates better liquidity</p>
              </div>
            </div>

            {/* Pattern Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>📊 Pattern Filters</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trendDirection">Trend Direction</Label>
                  <Select 
                    value={localFilters.trendDirection || ''} 
                    onValueChange={(value) => handleChange('trendDirection', value)}
                  >
                    <SelectTrigger id="trendDirection">
                      <SelectValue placeholder="Any trend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any trend</SelectItem>
                      <SelectItem value="Up">Uptrend</SelectItem>
                      <SelectItem value="Down">Downtrend</SelectItem>
                      <SelectItem value="Sideways">Sideways</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select 
                    value={localFilters.riskLevel || ''} 
                    onValueChange={(value) => handleChange('riskLevel', value)}
                  >
                    <SelectTrigger id="riskLevel">
                      <SelectValue placeholder="Any risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any risk level</SelectItem>
                      <SelectItem value="Low">Low Risk</SelectItem>
                      <SelectItem value="Medium">Medium Risk</SelectItem>
                      <SelectItem value="High">High Risk</SelectItem>
                      <SelectItem value="Very High">Very High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preset Examples */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Example Filters</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>High Growth:</strong> Min 1Y Return: 50%, Trend: Up</p>
                <p>• <strong>Low Risk Quality:</strong> Min Score: 70, Risk: Low</p>
                <p>• <strong>Turnaround Plays:</strong> Min Score Change 3M: 20%, Trend: Up</p>
                <p>• <strong>Liquid Large Caps:</strong> Min Turnover: 50000000</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

