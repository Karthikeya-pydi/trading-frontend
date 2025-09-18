export function formatCurrency(value: number | string) {
  return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function formatPercent(value: number | string) {
  return `${Number(value).toFixed(2)}%`;
}

// =============================================================================
// STOCK ANALYSIS FORMATTERS
// =============================================================================

/**
 * Format return value as percentage with proper sign and color indication
 */
export function formatReturn(value: number | null, showSign: boolean = true): string {
  if (value === null) return 'N/A'
  
  const formatted = (value * 100).toFixed(4)
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${formatted}%`
}

/**
 * Format return value with color class for UI display
 */
export function getReturnColorClass(value: number | null): string {
  if (value === null) return 'text-gray-500'
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-500'
}

/**
 * Format number with specified decimal places
 */
export function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null) return 'N/A'
  return Number(value).toFixed(decimals)
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(value: number | null): string {
  if (value === null) return 'N/A'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  } else {
    return value.toFixed(2)
  }
}

/**
 * Format date string to readable format
 */
export function formatAnalysisDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  } catch (error) {
    return dateString
  }
}

/**
 * Get color class for anomaly flags
 */
export function getAnomalyColorClass(isAnomaly: boolean, severity: 'mild' | 'major' | 'robust' | 'extreme' = 'mild'): string {
  if (!isAnomaly) return 'text-gray-500'
  
  switch (severity) {
    case 'mild':
      return 'text-yellow-600'
    case 'major':
      return 'text-orange-600'
    case 'robust':
      return 'text-red-600'
    case 'extreme':
      return 'text-red-800'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get badge variant for anomaly flags
 */
export function getAnomalyBadgeVariant(isAnomaly: boolean, severity: 'mild' | 'major' | 'robust' | 'extreme' = 'mild'): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!isAnomaly) return 'secondary'
  
  switch (severity) {
    case 'mild':
      return 'outline'
    case 'major':
      return 'outline'
    case 'robust':
      return 'destructive'
    case 'extreme':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/**
 * Format window readiness status
 */
export function formatWindowStatus(isReady: boolean): string {
  return isReady ? 'Ready' : 'Not Ready'
}

/**
 * Get color class for window readiness
 */
export function getWindowStatusColorClass(isReady: boolean): string {
  return isReady ? 'text-green-600' : 'text-gray-500'
}