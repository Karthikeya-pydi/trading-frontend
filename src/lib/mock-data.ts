import { StockAnalysisResponse, DetailedStockData } from '@/types'

/**
 * Generate mock stock analysis data for development/testing
 */
export function generateMockStockAnalysis(symbol: string): StockAnalysisResponse {
  const now = new Date()
  const analysisDate = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Random time within last 24 hours
  
  // Generate detailed data (last 100 days)
  const detailedData: DetailedStockData[] = []
  const basePrice = 1000 + Math.random() * 5000 // Random base price between 1000-6000
  
  for (let i = 99; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const dailyReturn = (Math.random() - 0.5) * 0.1 // Random return between -5% and +5%
    const price = basePrice * (1 + dailyReturn * i / 100) // Trending price with daily variations
    
    const isAnomaly = Math.random() < 0.05 // 5% chance of being an anomaly
    const isMajorAnomaly = Math.random() < 0.01 // 1% chance of being major anomaly
    const isRobustOutlier = Math.random() < 0.02 // 2% chance of being robust outlier
    const isVeryExtreme = Math.random() < 0.005 // 0.5% chance of being very extreme
    
    detailedData.push({
      symbol: symbol.toUpperCase(),
      date: date.toISOString(),
      open: price * (0.99 + Math.random() * 0.02),
      high: price * (1.01 + Math.random() * 0.02),
      low: price * (0.98 + Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      log_returns: i === 99 ? null : Math.log(price / (detailedData[detailedData.length - 1]?.close || price)),
      global_outlier_flag: isAnomaly && Math.random() < 0.3,
      mild_anomaly_flag: isAnomaly && !isMajorAnomaly,
      major_anomaly_flag: isMajorAnomaly,
      robust_outlier_flag: isRobustOutlier,
      very_extreme_flag: isVeryExtreme,
      window_ready_10: i >= 9,
      window_ready_40: i >= 39,
      window_ready_120: i >= 119
    })
  }

  // Calculate statistics from the data
  const returns = detailedData.map(d => d.log_returns).filter(r => r !== null) as number[]
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
  const stdReturn = Math.sqrt(variance)
  
  // Calculate skewness and kurtosis
  const skewness = returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdReturn, 3), 0) / returns.length
  const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdReturn, 4), 0) / returns.length - 3
  
  const minReturn = Math.min(...returns)
  const maxReturn = Math.max(...returns)
  const sortedReturns = [...returns].sort((a, b) => a - b)
  
  const p1Return = sortedReturns[Math.floor(sortedReturns.length * 0.01)]
  const p5Return = sortedReturns[Math.floor(sortedReturns.length * 0.05)]
  const p95Return = sortedReturns[Math.floor(sortedReturns.length * 0.95)]
  const p99Return = sortedReturns[Math.floor(sortedReturns.length * 0.99)]

  return {
    symbol: symbol.toUpperCase(),
    data_points: detailedData.length,
    analysis_date: analysisDate.toISOString(),
    descriptive_stats: {
      n_days: detailedData.length,
      pct_missing: Math.random() * 5, // 0-5% missing data
      start_date: detailedData[0].date,
      end_date: detailedData[detailedData.length - 1].date,
      mean_return: meanReturn,
      std_return: stdReturn,
      skew_return: skewness,
      kurtosis_return: kurtosis,
      min_return: minReturn,
      p1_return: p1Return,
      p5_return: p5Return,
      p95_return: p95Return,
      p99_return: p99Return,
      max_return: maxReturn,
      illiquid_flag: Math.random() < 0.1 // 10% chance of being illiquid
    },
    global_analysis: {
      global_median: sortedReturns[Math.floor(sortedReturns.length * 0.5)],
      global_mad: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.5)] - meanReturn),
      global_outlier_count: detailedData.filter(d => d.global_outlier_flag).length
    },
    rolling_analysis: {
      window_ready_10: detailedData.filter(d => d.window_ready_10).length,
      window_ready_40: detailedData.filter(d => d.window_ready_40).length,
      window_ready_120: detailedData.filter(d => d.window_ready_120).length,
      mild_anomaly_count: detailedData.filter(d => d.mild_anomaly_flag).length,
      major_anomaly_count: detailedData.filter(d => d.major_anomaly_flag).length
    },
    per_stock_analysis: {
      per_stock_median: sortedReturns[Math.floor(sortedReturns.length * 0.5)],
      per_stock_mad: Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.5)] - meanReturn),
      robust_outlier_count: detailedData.filter(d => d.robust_outlier_flag).length,
      very_extreme_count: detailedData.filter(d => d.very_extreme_flag).length
    },
    detailed_data: detailedData
  }
}
