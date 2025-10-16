"use client"

import React from 'react'

interface SparklineProps {
  data: (number | null)[]
  width?: number
  height?: number
  color?: string
  showDots?: boolean
  className?: string
}

export function Sparkline({ 
  data, 
  width = 80, 
  height = 24, 
  color = '#10b981', 
  showDots = false,
  className = ''
}: SparklineProps) {
  // Filter out null values
  const validData = data.filter(d => d !== null) as number[]
  
  if (validData.length === 0) {
    return <div className={`${className}`} style={{ width, height }} />
  }

  const min = Math.min(...validData)
  const max = Math.max(...validData)
  const range = max - min || 1 // Avoid division by zero

  // Calculate points for the line
  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return { x, y, value }
  })

  // Create path data
  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${point.x} ${point.y}`
    })
    .join(' ')

  // Determine color based on trend
  const trend = validData[validData.length - 1] - validData[0]
  const strokeColor = color === 'auto' 
    ? (trend >= 0 ? '#10b981' : '#ef4444')
    : color

  return (
    <svg 
      width={width} 
      height={height} 
      className={`inline-block ${className}`}
      style={{ overflow: 'visible' }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={strokeColor}
        />
      ))}
    </svg>
  )
}

interface TrendArrowProps {
  value: number | null
  threshold?: number
  className?: string
}

export function TrendArrow({ value, threshold = 0, className = '' }: TrendArrowProps) {
  if (value === null) {
    return <span className={`text-gray-400 ${className}`}>—</span>
  }

  if (value > threshold) {
    return (
      <span className={`text-green-600 font-bold ${className}`}>↗</span>
    )
  } else if (value < -threshold) {
    return (
      <span className={`text-red-600 font-bold ${className}`}>↘</span>
    )
  } else {
    return (
      <span className={`text-gray-500 ${className}`}>→</span>
    )
  }
}

interface RatingStarsProps {
  rating: 1 | 2 | 3 | 4 | 5
  className?: string
}

export function RatingStars({ rating, className = '' }: RatingStarsProps) {
  return (
    <div className={`flex items-center space-x-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
        >
          ★
        </span>
      ))}
    </div>
  )
}

interface ColorGradientBarProps {
  value: number
  min: number
  max: number
  height?: number
  className?: string
}

export function ColorGradientBar({ 
  value, 
  min, 
  max, 
  height = 4, 
  className = '' 
}: ColorGradientBarProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  
  // Color gradient from red to yellow to green
  let bgColor = 'bg-red-500'
  if (percentage > 66) bgColor = 'bg-green-500'
  else if (percentage > 33) bgColor = 'bg-yellow-500'

  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`} style={{ height }}>
      <div 
        className={`${bgColor} rounded-full transition-all duration-300`} 
        style={{ width: `${percentage}%`, height: '100%' }}
      />
    </div>
  )
}

interface RiskBadgeProps {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  className?: string
}

export function RiskBadge({ riskLevel, className = '' }: RiskBadgeProps) {
  const colors = {
    'Low': 'bg-green-100 text-green-800 border-green-300',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'High': 'bg-orange-100 text-orange-800 border-orange-300',
    'Very High': 'bg-red-100 text-red-800 border-red-300'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[riskLevel]} ${className}`}>
      {riskLevel}
    </span>
  )
}

