// =============================================================================
// STOCK SCREENING TYPES
// =============================================================================

export interface TableData {
  headers: string[]
  rows: string[][]
  raw_html: string
}

export interface StockScreeningData {
  id: number
  stock_symbol: string
  stock_name: string
  company_url: string
  scraping_status: 'pending' | 'success' | 'failed' | 'refreshing'
  last_scraped_at: string | null
  error_message: string | null
  html_files: string[] | null
  pdf_files: string[] | null
  created_at: string
  updated_at: string
  
  // Financial data sections
  quarters_data?: TableData
  peers_data?: TableData
  profit_loss_data?: TableData
  balance_sheet_data?: TableData
  ratios_data?: TableData
  cash_flow_data?: TableData
  shareholding_data?: TableData
  overview_data?: Record<string, string>
  technical_data?: TableData
  valuation_data?: TableData
  growth_data?: TableData
  industry_data?: TableData
}

export interface StockSearchRequest {
  query: string
}

export interface StockSearchResponse {
  stocks: StockScreeningData[]
  total_count: number
  message: string
}

export interface StockScrapeRequest {
  stock_symbol: string
  stock_name: string
}

export interface StockScrapeResponse {
  stock_symbol: string
  status: string
  message: string
  last_scraped_at: string | null
}

export interface StockRefreshResponse {
  stock_symbol: string
  status: string
  message: string
  last_scraped_at: string | null
}

export interface StockDeleteResponse {
  message: string
}

