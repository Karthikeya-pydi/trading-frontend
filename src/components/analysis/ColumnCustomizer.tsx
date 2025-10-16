"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Eye, EyeOff, RotateCcw } from "lucide-react"
import { ColumnConfig, DEFAULT_COLUMNS } from "@/lib/returns-utils"

interface ColumnCustomizerProps {
  columns: ColumnConfig[]
  onUpdate: (columns: ColumnConfig[]) => void
  onClose: () => void
}

export function ColumnCustomizer({ columns, onUpdate, onClose }: ColumnCustomizerProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)

  const categories = [
    { id: 'basic', label: 'Basic Info', color: 'bg-blue-100 text-blue-800' },
    { id: 'returns', label: 'Returns', color: 'bg-green-100 text-green-800' },
    { id: 'scores', label: 'Scores', color: 'bg-purple-100 text-purple-800' },
    { id: 'patterns', label: 'Patterns', color: 'bg-orange-100 text-orange-800' },
    { id: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
  ]

  const toggleColumn = (columnId: string) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const toggleCategory = (category: string) => {
    const categoryColumns = localColumns.filter(col => col.category === category)
    const allVisible = categoryColumns.every(col => col.visible)

    setLocalColumns(prev =>
      prev.map(col =>
        col.category === category ? { ...col, visible: !allVisible } : col
      )
    )
  }

  const resetToDefaults = () => {
    setLocalColumns(DEFAULT_COLUMNS)
  }

  const handleSave = () => {
    onUpdate(localColumns)
    onClose()
  }

  const visibleCount = localColumns.filter(col => col.visible).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-teal-600" />
                <span>Customize Columns</span>
              </CardTitle>
              <CardDescription>
                Show or hide columns in the returns table. {visibleCount} of {localColumns.length} columns visible.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map(category => {
              const categoryColumns = localColumns.filter(col => col.category === category.id)
              const visibleInCategory = categoryColumns.filter(col => col.visible).length
              const allVisible = visibleInCategory === categoryColumns.length

              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={category.color}>
                        {category.label}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {visibleInCategory} / {categoryColumns.length} visible
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {allVisible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide All
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show All
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryColumns.map(column => (
                      <div
                        key={column.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          column.visible
                            ? 'bg-teal-50 border-teal-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={column.id}
                          checked={column.visible}
                          onCheckedChange={() => toggleColumn(column.id)}
                        />
                        <label
                          htmlFor={column.id}
                          className={`flex-1 text-sm cursor-pointer ${
                            column.visible ? 'font-medium text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {column.label}
                        </label>
                        {column.sortable && (
                          <Badge variant="outline" className="text-xs">
                            Sortable
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Apply Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

