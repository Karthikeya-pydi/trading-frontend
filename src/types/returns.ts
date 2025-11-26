// =============================================================================
// RETURNS DATA TYPES
// =============================================================================

export interface ReturnsFile {
  filename: string
  s3_key: string
  size_mb: number
  last_modified: string
  source: string
}

export interface ReturnsFilesListResponse {
  message: string
  files: ReturnsFile[]
  total_files: number
  source: string
  timestamp: string
}

export interface ReturnsRecord {
  symbol: string
  fincode: string
  isin: string
  latest_date: string
  latest_close: number
  latest_volume: number
  turnover: number | null
  
  // 📈 Basic Returns (%)
  returns_1_week: number | null
  returns_1_month: number | null
  returns_3_months: number | null
  returns_6_months: number | null
  returns_9_months: number | null
  returns_1_year: number | null
  returns_3_years: number | null
  returns_5_years: number | null
  
  // 🎯 Current Scoring
  raw_score: number | null
  
  // 📊 Historical Raw Scores (what score was X time ago)
  raw_score_1_week_ago: number | null
  raw_score_1_month_ago: number | null
  raw_score_3_months_ago: number | null
  raw_score_6_months_ago: number | null
  raw_score_9_months_ago: number | null
  raw_score_1_year_ago: number | null
  
  // 📈 Score Change Percentages (% change vs historical)
  score_change_1_week: number | null
  score_change_1_month: number | null
  score_change_3_months: number | null
  score_change_6_months: number | null
  score_change_9_months: number | null
  score_change_1_year: number | null
  
  // 🔄 Sign Pattern Analysis (Current, Historical)
  sign_pattern_1_week: string | null
  sign_pattern_1_month: string | null
  sign_pattern_3_months: string | null
  sign_pattern_6_months: string | null
  sign_pattern_9_months: string | null
  sign_pattern_1_year: string | null
  
  // 🏢 Company Information
  sector: string | null
  industry: string | null
  market_cap_crore: number | null
  roe_percent: number | null
  roce_percent: number | null
}

export interface ReturnsFileDataResponse {
  status: string
  message: string
  data: ReturnsRecord[]
  total_count: number
  source_file: string
  file_size_mb: number
  last_modified: string
  source: string
  timestamp: string
}

export interface ReturnsStockResponse {
  status: string
  symbol: string
  data: ReturnsRecord
  source_file: string
  source: string
  timestamp: string
}

export interface ReturnsAllResponse {
  status: string
  data: ReturnsRecord[]
  total_count: number
  source_file: string
  timestamp: string
}

