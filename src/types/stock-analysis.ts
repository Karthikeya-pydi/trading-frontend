// =============================================================================
// STOCK ANALYSIS TYPES
// =============================================================================

export interface DescriptiveStats {
  n_days: number
  pct_missing: number
  start_date: string
  end_date: string
  mean_return: number
  std_return: number
  skew_return: number
  kurtosis_return: number
  min_return: number
  p1_return: number
  p5_return: number
  p95_return: number
  p99_return: number
  max_return: number
  illiquid_flag: boolean
}

export interface GlobalAnalysis {
  global_median: number
  global_mad: number
  global_outlier_count: number
}

export interface RollingAnalysis {
  window_ready_10: number
  window_ready_40: number
  window_ready_120: number
  mild_anomaly_count: number
  major_anomaly_count: number
}

export interface PerStockAnalysis {
  per_stock_median: number
  per_stock_mad: number
  robust_outlier_count: number
  very_extreme_count: number
}

export interface DetailedStockData {
  symbol: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  log_returns: number | null
  global_outlier_flag: boolean
  mild_anomaly_flag: boolean
  major_anomaly_flag: boolean
  robust_outlier_flag: boolean
  very_extreme_flag: boolean
  window_ready_10: boolean
  window_ready_40: boolean
  window_ready_120: boolean
}

export interface StockAnalysisResponse {
  symbol: string
  data_points: number
  analysis_date: string
  descriptive_stats: DescriptiveStats
  global_analysis: GlobalAnalysis
  rolling_analysis: RollingAnalysis
  per_stock_analysis: PerStockAnalysis
  detailed_data: DetailedStockData[]
}

export interface AvailableStocksResponse {
  stocks: string[]
  count: number
}

export interface StockAnalysisError {
  detail: string
}

