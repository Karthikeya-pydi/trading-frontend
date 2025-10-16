/**
 * Utility functions for returns analysis
 */

import { ReturnsRecord } from "@/types"

// =============================================================================
// FILTER PRESETS
// =============================================================================

export interface FilterPreset {
  id: string
  name: string
  description: string
  icon: string
  filterFn: (record: ReturnsRecord) => boolean
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "all",
    name: "All Stocks",
    description: "Show all stocks",
    icon: "list",
    filterFn: () => true
  },
  {
    id: "top_gainers_1y",
    name: "Top Gainers (1Y)",
    description: "Stocks with >50% returns in 1 year",
    icon: "trending-up",
    filterFn: (record) => (record.returns_1_year || 0) > 50
  },
  {
    id: "high_momentum",
    name: "High Momentum",
    description: "Positive returns across all periods",
    icon: "rocket",
    filterFn: (record) => 
      (record.returns_1_week || 0) > 0 &&
      (record.returns_1_month || 0) > 0 &&
      (record.returns_3_months || 0) > 0 &&
      (record.returns_6_months || 0) > 0
  },
  {
    id: "turnaround",
    name: "Turnaround Stocks",
    description: "Negative 3M but positive 1M returns",
    icon: "refresh-cw",
    filterFn: (record) => 
      (record.returns_3_months || 0) < 0 &&
      (record.returns_1_month || 0) > 5
  },
  {
    id: "consistent_performers",
    name: "Consistent Performers",
    description: "Positive returns across all periods",
    icon: "award",
    filterFn: (record) => 
      (record.returns_1_month || 0) > 0 &&
      (record.returns_3_months || 0) > 0 &&
      (record.returns_6_months || 0) > 0 &&
      (record.returns_1_year || 0) > 0
  },
  {
    id: "value_picks",
    name: "Value Picks",
    description: "Low score but improving trend",
    icon: "gem",
    filterFn: (record) => 
      (record.raw_score || 0) < 50 &&
      (record.score_change_1_month || 0) > 10
  },
  {
    id: "high_score",
    name: "High Score Stocks",
    description: "Raw score > 70",
    icon: "star",
    filterFn: (record) => (record.raw_score || 0) > 70
  },
  {
    id: "improving_score",
    name: "Improving Scores",
    description: "Score change > 20% in 3 months",
    icon: "trending-up",
    filterFn: (record) => (record.score_change_3_months || 0) > 20
  },
  {
    id: "high_turnover",
    name: "High Liquidity",
    description: "High turnover stocks (top tier)",
    icon: "activity",
    filterFn: (record) => (record.turnover || 0) > 10000000
  },
  {
    id: "recent_breakout",
    name: "Recent Breakouts",
    description: "Strong 1W return, improving score",
    icon: "zap",
    filterFn: (record) => 
      (record.returns_1_week || 0) > 5 &&
      (record.score_change_1_week || 0) > 5
  }
]

// =============================================================================
// RISK METRICS CALCULATIONS
// =============================================================================

export interface RiskMetrics {
  volatility: number | null
  sharpeRatio: number | null
  maxDrawdown: number | null
  beta: number | null
  alpha: number | null
  consistency: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
}

export function calculateRiskMetrics(record: ReturnsRecord): RiskMetrics {
  const returns = [
    record.returns_1_week,
    record.returns_1_month,
    record.returns_3_months,
    record.returns_6_months,
    record.returns_9_months,
    record.returns_1_year
  ].filter(r => r !== null) as number[]

  if (returns.length === 0) {
    return {
      volatility: null,
      sharpeRatio: null,
      maxDrawdown: null,
      beta: null,
      alpha: null,
      consistency: 0,
      riskLevel: 'Medium'
    }
  }

  // Calculate volatility (standard deviation)
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)

  // Simplified Sharpe Ratio (assuming risk-free rate of 6%)
  const riskFreeRate = 6
  const excessReturn = mean - riskFreeRate
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : null

  // Calculate max drawdown (simplified)
  let maxDrawdown = 0
  for (let i = 0; i < returns.length - 1; i++) {
    for (let j = i + 1; j < returns.length; j++) {
      const drawdown = returns[i] - returns[j]
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
  }

  // Calculate consistency (percentage of positive returns)
  const positiveReturns = returns.filter(r => r > 0).length
  const consistency = (positiveReturns / returns.length) * 100

  // Determine risk level
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 'Medium'
  if (volatility < 10) riskLevel = 'Low'
  else if (volatility < 20) riskLevel = 'Medium'
  else if (volatility < 35) riskLevel = 'High'
  else riskLevel = 'Very High'

  return {
    volatility,
    sharpeRatio,
    maxDrawdown: maxDrawdown || null,
    beta: null, // Would need market data for accurate calculation
    alpha: null, // Would need benchmark data
    consistency,
    riskLevel
  }
}

// =============================================================================
// PATTERN ANALYSIS
// =============================================================================

export interface PatternAnalysis {
  trendDirection: 'Up' | 'Down' | 'Sideways'
  trendStrength: 'Strong' | 'Moderate' | 'Weak'
  momentum: 'Accelerating' | 'Decelerating' | 'Stable'
  signPattern: string
  patternScore: number
}

export function analyzePattern(record: ReturnsRecord): PatternAnalysis {
  const returns = [
    record.returns_1_week || 0,
    record.returns_1_month || 0,
    record.returns_3_months || 0,
    record.returns_6_months || 0
  ]

  // Determine trend direction
  const positiveCount = returns.filter(r => r > 0).length
  let trendDirection: 'Up' | 'Down' | 'Sideways' = 'Sideways'
  if (positiveCount >= 3) trendDirection = 'Up'
  else if (positiveCount <= 1) trendDirection = 'Down'

  // Determine trend strength
  const avgReturn = Math.abs(returns.reduce((a, b) => a + b, 0) / returns.length)
  let trendStrength: 'Strong' | 'Moderate' | 'Weak' = 'Moderate'
  if (avgReturn > 20) trendStrength = 'Strong'
  else if (avgReturn < 5) trendStrength = 'Weak'

  // Determine momentum
  const recentReturn = (record.returns_1_week || 0) + (record.returns_1_month || 0)
  const olderReturn = (record.returns_3_months || 0) + (record.returns_6_months || 0)
  let momentum: 'Accelerating' | 'Decelerating' | 'Stable' = 'Stable'
  if (recentReturn > olderReturn * 1.2) momentum = 'Accelerating'
  else if (recentReturn < olderReturn * 0.8) momentum = 'Decelerating'

  // Create sign pattern
  const signPattern = returns.map(r => r > 0 ? '+' : r < 0 ? '-' : '0').join('')

  // Calculate pattern score (higher is better)
  const patternScore = 
    positiveCount * 25 + // More positive periods = higher score
    (trendDirection === 'Up' ? 25 : 0) +
    (momentum === 'Accelerating' ? 25 : 0) +
    (trendStrength === 'Strong' ? 25 : 0)

  return {
    trendDirection,
    trendStrength,
    momentum,
    signPattern,
    patternScore
  }
}

// =============================================================================
// RANKING & SCORING
// =============================================================================

export interface CompositeScore {
  overall: number
  momentum: number
  quality: number
  value: number
  growth: number
  percentile: number
  rating: 1 | 2 | 3 | 4 | 5
}

export function calculateCompositeScore(
  record: ReturnsRecord, 
  allRecords: ReturnsRecord[]
): CompositeScore {
  // Momentum Score (30% weight): Based on recent returns
  const momentumScore = Math.min(100, Math.max(0,
    ((record.returns_1_week || 0) * 0.1 +
     (record.returns_1_month || 0) * 0.3 +
     (record.returns_3_months || 0) * 0.6) / 3 * 2 + 50
  ))

  // Quality Score (25% weight): Based on consistency and score changes
  const scoreChanges = [
    record.score_change_1_week,
    record.score_change_1_month,
    record.score_change_3_months
  ].filter(s => s !== null) as number[]
  const avgScoreChange = scoreChanges.length > 0 
    ? scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length 
    : 0
  const qualityScore = Math.min(100, Math.max(0, (record.raw_score || 50) + avgScoreChange * 0.5))

  // Value Score (20% weight): Based on current score vs historical
  const historicalScores = [
    record.raw_score_1_month_ago,
    record.raw_score_3_months_ago,
    record.raw_score_6_months_ago
  ].filter(s => s !== null) as number[]
  const avgHistoricalScore = historicalScores.length > 0
    ? historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length
    : record.raw_score || 50
  const valueScore = Math.min(100, Math.max(0, 
    ((record.raw_score || 50) / avgHistoricalScore) * 50
  ))

  // Growth Score (25% weight): Based on long-term returns
  const growthScore = Math.min(100, Math.max(0,
    ((record.returns_6_months || 0) * 0.4 +
     (record.returns_1_year || 0) * 0.6) / 2 * 1.5 + 50
  ))

  // Overall composite score (weighted average)
  const overall = 
    momentumScore * 0.30 +
    qualityScore * 0.25 +
    valueScore * 0.20 +
    growthScore * 0.25

  // Calculate percentile rank
  const scores = allRecords.map(r => 
    ((r.returns_1_year || 0) + (r.raw_score || 50)) / 2
  ).sort((a, b) => a - b)
  const currentScore = ((record.returns_1_year || 0) + (record.raw_score || 50)) / 2
  const rank = scores.filter(s => s < currentScore).length
  const percentile = (rank / scores.length) * 100

  // Calculate star rating (1-5)
  let rating: 1 | 2 | 3 | 4 | 5 = 3
  if (overall >= 80) rating = 5
  else if (overall >= 70) rating = 4
  else if (overall >= 50) rating = 3
  else if (overall >= 30) rating = 2
  else rating = 1

  return {
    overall: Math.round(overall * 10) / 10,
    momentum: Math.round(momentumScore * 10) / 10,
    quality: Math.round(qualityScore * 10) / 10,
    value: Math.round(valueScore * 10) / 10,
    growth: Math.round(growthScore * 10) / 10,
    percentile: Math.round(percentile * 10) / 10,
    rating
  }
}

// =============================================================================
// COMPARISON UTILITIES
// =============================================================================

export interface ComparisonMetrics {
  symbol: string
  returns_1_week: number | null
  returns_1_month: number | null
  returns_3_months: number | null
  returns_6_months: number | null
  returns_1_year: number | null
  raw_score: number | null
  score_change_3_months: number | null
  turnover: number | null
  compositeScore: CompositeScore
  riskMetrics: RiskMetrics
  pattern: PatternAnalysis
}

export function prepareComparison(
  records: ReturnsRecord[],
  allRecords: ReturnsRecord[]
): ComparisonMetrics[] {
  return records.map(record => ({
    symbol: record.symbol,
    returns_1_week: record.returns_1_week,
    returns_1_month: record.returns_1_month,
    returns_3_months: record.returns_3_months,
    returns_6_months: record.returns_6_months,
    returns_1_year: record.returns_1_year,
    raw_score: record.raw_score,
    score_change_3_months: record.score_change_3_months,
    turnover: record.turnover,
    compositeScore: calculateCompositeScore(record, allRecords),
    riskMetrics: calculateRiskMetrics(record),
    pattern: analyzePattern(record)
  }))
}

// =============================================================================
// COLUMN CONFIGURATION
// =============================================================================

export interface ColumnConfig {
  id: string
  label: string
  category: 'basic' | 'returns' | 'scores' | 'patterns' | 'advanced'
  visible: boolean
  sortable: boolean
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Basic Info
  { id: 'symbol', label: 'Symbol', category: 'basic', visible: true, sortable: true },
  { id: 'fincode', label: 'Fincode', category: 'basic', visible: false, sortable: false },
  { id: 'latest_close', label: 'Latest Close', category: 'basic', visible: true, sortable: true },
  { id: 'latest_volume', label: 'Volume', category: 'basic', visible: true, sortable: true },
  { id: 'turnover', label: 'Turnover', category: 'basic', visible: true, sortable: true },
  
  // Scores
  { id: 'raw_score', label: 'Raw Score', category: 'scores', visible: true, sortable: true },
  { id: 'composite_score', label: 'Composite Score', category: 'advanced', visible: true, sortable: true },
  
  // Returns
  { id: 'returns_1_week', label: '1 Week', category: 'returns', visible: true, sortable: true },
  { id: 'returns_1_month', label: '1 Month', category: 'returns', visible: true, sortable: true },
  { id: 'returns_3_months', label: '3 Months', category: 'returns', visible: true, sortable: true },
  { id: 'returns_6_months', label: '6 Months', category: 'returns', visible: true, sortable: true },
  { id: 'returns_9_months', label: '9 Months', category: 'returns', visible: false, sortable: true },
  { id: 'returns_1_year', label: '1 Year', category: 'returns', visible: true, sortable: true },
  { id: 'returns_3_years', label: '3 Years', category: 'returns', visible: false, sortable: true },
  { id: 'returns_5_years', label: '5 Years', category: 'returns', visible: false, sortable: true },
  
  // Historical Scores
  { id: 'raw_score_1_week_ago', label: '1W Ago Score', category: 'scores', visible: false, sortable: false },
  { id: 'raw_score_1_month_ago', label: '1M Ago Score', category: 'scores', visible: false, sortable: false },
  { id: 'raw_score_3_months_ago', label: '3M Ago Score', category: 'scores', visible: false, sortable: false },
  
  // Score Changes
  { id: 'score_change_1_week', label: '1W Score %', category: 'scores', visible: true, sortable: true },
  { id: 'score_change_1_month', label: '1M Score %', category: 'scores', visible: true, sortable: true },
  { id: 'score_change_3_months', label: '3M Score %', category: 'scores', visible: true, sortable: true },
  
  // Patterns
  { id: 'sign_pattern_1_month', label: '1M Pattern', category: 'patterns', visible: false, sortable: false },
  { id: 'sign_pattern_3_months', label: '3M Pattern', category: 'patterns', visible: false, sortable: false },
  
  // Advanced Metrics
  { id: 'volatility', label: 'Volatility', category: 'advanced', visible: false, sortable: true },
  { id: 'sharpe_ratio', label: 'Sharpe Ratio', category: 'advanced', visible: false, sortable: true },
  { id: 'risk_level', label: 'Risk Level', category: 'advanced', visible: false, sortable: true }
]

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export function exportToEnhancedCSV(
  records: ReturnsRecord[],
  allRecords: ReturnsRecord[],
  includeAdvancedMetrics: boolean = true
): string {
  const headers = [
    'Symbol',
    'Fincode',
    'ISIN',
    'Latest Close',
    'Volume',
    'Turnover',
    'Raw Score',
    ...(includeAdvancedMetrics ? ['Composite Score', 'Rating'] : []),
    '1W Return %',
    '1M Return %',
    '3M Return %',
    '6M Return %',
    '1Y Return %',
    '3Y Return %',
    '5Y Return %',
    'Score Change 3M %',
    ...(includeAdvancedMetrics ? ['Volatility', 'Sharpe Ratio', 'Risk Level', 'Trend', 'Momentum'] : [])
  ]

  const rows = records.map(record => {
    const compositeScore = includeAdvancedMetrics ? calculateCompositeScore(record, allRecords) : null
    const riskMetrics = includeAdvancedMetrics ? calculateRiskMetrics(record) : null
    const pattern = includeAdvancedMetrics ? analyzePattern(record) : null

    return [
      record.symbol,
      record.fincode,
      record.isin,
      record.latest_close,
      record.latest_volume,
      record.turnover || '',
      record.raw_score || '',
      ...(includeAdvancedMetrics && compositeScore ? [compositeScore.overall, compositeScore.rating] : []),
      record.returns_1_week || '',
      record.returns_1_month || '',
      record.returns_3_months || '',
      record.returns_6_months || '',
      record.returns_1_year || '',
      record.returns_3_years || '',
      record.returns_5_years || '',
      record.score_change_3_months || '',
      ...(includeAdvancedMetrics && riskMetrics && pattern ? [
        riskMetrics.volatility?.toFixed(2) || '',
        riskMetrics.sharpeRatio?.toFixed(2) || '',
        riskMetrics.riskLevel,
        pattern.trendDirection,
        pattern.momentum
      ] : [])
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => 
      typeof field === 'string' && (field.includes(',') || field.includes('"')) 
        ? `"${field.replace(/"/g, '""')}"` 
        : field
    ).join(','))
  ].join('\n')

  return csvContent
}

// =============================================================================
// SEARCH AND FILTER UTILITIES
// =============================================================================

export function advancedFilter(
  records: ReturnsRecord[],
  filters: {
    minReturn1Y?: number
    maxReturn1Y?: number
    minScore?: number
    maxScore?: number
    minTurnover?: number
    minScoreChange3M?: number
    trendDirection?: 'Up' | 'Down' | 'Sideways'
    riskLevel?: 'Low' | 'Medium' | 'High' | 'Very High'
  }
): ReturnsRecord[] {
  return records.filter(record => {
    if (filters.minReturn1Y !== undefined && (record.returns_1_year || 0) < filters.minReturn1Y) {
      return false
    }
    if (filters.maxReturn1Y !== undefined && (record.returns_1_year || 0) > filters.maxReturn1Y) {
      return false
    }
    if (filters.minScore !== undefined && (record.raw_score || 0) < filters.minScore) {
      return false
    }
    if (filters.maxScore !== undefined && (record.raw_score || 0) > filters.maxScore) {
      return false
    }
    if (filters.minTurnover !== undefined && (record.turnover || 0) < filters.minTurnover) {
      return false
    }
    if (filters.minScoreChange3M !== undefined && (record.score_change_3_months || 0) < filters.minScoreChange3M) {
      return false
    }
    if (filters.trendDirection) {
      const pattern = analyzePattern(record)
      if (pattern.trendDirection !== filters.trendDirection) {
        return false
      }
    }
    if (filters.riskLevel) {
      const riskMetrics = calculateRiskMetrics(record)
      if (riskMetrics.riskLevel !== filters.riskLevel) {
        return false
      }
    }
    return true
  })
}

