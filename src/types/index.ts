// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface User {
  id: number
  email: string
  name: string
  profile_picture?: string
  is_verified: boolean
  has_iifl_market_credentials: boolean
  has_iifl_interactive_credentials: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginForm {
  email: string
  password: string
}

export interface ApiKeys {
  market_api_key: string
  market_secret_key: string
  interactive_api_key?: string
  interactive_secret_key?: string
}

export interface IIFLCredentials {
  api_key: string
  secret_key: string
}

export interface SetupForm {
  market_api_key: string
  market_secret_key: string
  interactive_api_key: string
  interactive_secret_key: string
}

// =============================================================================
// TRADING TYPES
// =============================================================================

export interface Position {
  ltp: number
  pnl: number
  avg_price: number
  symbol: string
  position_id: number
  id: number
  underlying_instrument: string
  option_type?: string
  strike_price?: number
  expiry_date?: string
  quantity: number
  average_price: number
  current_price: number
  unrealized_pnl: number
  stop_loss_price?: number
  stop_loss_active: boolean
  pnl_percent?: number
}

export interface Trade {
  trade_id: string
  symbol: string
  quantity: number
  price: number
  side: 'BUY' | 'SELL'
  timestamp: string
}

export interface Order {
  order_id: string
  symbol: string
  quantity: number
  price: number
  order_type: string
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED'
  side: 'BUY' | 'SELL'
  created_at: string
}

export interface OrderForm {
  underlying_instrument?: string
  option_type?: string
  strike_price?: number
  expiry_date?: string
  order_type: string
  quantity: number
  price: number
  stop_loss_price?: number
  symbol?: string
  side?: 'BUY' | 'SELL'
}

// =============================================================================
// PORTFOLIO TYPES
// =============================================================================

export interface Holding {
  id: number
  instrument: string
  quantity: number
  average_price: number
  current_price: number
  market_value: number
  invested_value: number
  pnl: number
  pnl_percentage: number
  day_change: number
  day_change_percentage: number
}

export interface PortfolioSummary {
  total_value: number
  total_pnl: number
  day_pnl: number
  positions_count: number
  available_margin: number
  total_investment: number
  unrealized_pnl: number
  realized_pnl: number
}

export interface PnLData {
  total_pnl: number
  realized_pnl: number
  unrealized_pnl: number
  day_pnl: number
  positions: Array<{
    instrument: string
    quantity: number
    average_price: number
    current_price: number
    unrealized_pnl: number
    pnl_percentage: number
  }>
}

export interface HoldingsSummary {
  total_holdings: number
  total_invested: number
  current_value: number
  total_pnl: number
  total_pnl_percentage: number
  day_pnl: number
  day_pnl_percentage: number
  holdings?: Holding[]
}

export interface DailyPnL {
  date: string
  opening_value: number
  closing_value: number
  day_pnl: number
  day_pnl_percentage: number
  trades_count: number
  realized_pnl: number
  unrealized_pnl: number
}

export interface RiskMetrics {
  portfolio_value: number
  total_exposure: number
  available_margin: number
  margin_utilization: number
  max_loss: number
  risk_percentage: number
  concentration_risk: {
    top_holding_percentage: number
    top_3_holdings_percentage: number
  }
}

export interface UpdatePricesResponse {
  status: string
  message: string
  updated_positions: number
  timestamp: string
}

export interface SquareOffResponse {
  status: string
  message: string
}

// =============================================================================
// MARKET DATA TYPES
// =============================================================================

export interface Instrument {
  ExchangeSegment: string
  ExchangeInstrumentID: string
  InstrumentType: string
  Name: string
  DisplayName: string
  Symbol: string
  ISIN: string
}

export interface InstrumentIdentifier {
  exchangeSegment: string
  exchangeInstrumentID: string
}

export interface MarketQuote {
  exchangeSegment: string
  exchangeInstrumentID: string
  lastTradedPrice: number
  volume: number
  open: number
  high: number
  low: number
  close: number
}

export interface MarketDataBasic {
  symbol: string
  ltp: number
  change: number
  change_percent: number
  volume: number
}

export interface MarketDataResponse {
  type: string
  code: string
  description: string
  result: {
    mdp: number
    quotesList: InstrumentIdentifier[]
    listQuotes: MarketQuote[]
  }
}

export interface LTPResponse {
  type: string
  code: string
  description: string
  result: {
    mdp: number
    quotesList: InstrumentIdentifier[]
    listQuotes: MarketQuote[]
  }
}

export interface InstrumentSearchResponse {
  type: string
  query: string
  total_found: number
  returned: number
  results: Instrument[]
}

export interface WatchlistItem {
  instrument: Instrument
  quote?: MarketQuote
  addedAt: Date
}

// =============================================================================
// API & UTILITY TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface TabComponentProps {
  className?: string
  children?: React.ReactNode
}

// =============================================================================
// STOCK DATA TYPES
// =============================================================================

export interface StockInfo {
  name: string
  symbol: string
  exchange_segment: number
  instrument_id: string
  series: string
  isin: string
  lot_size: string
  tick_size: string
  price_band_high: string
  price_band_low: string
}

export interface TouchlineQuote {
  LastTradedPrice: number
  PercentChange: number
  Open: number
  High: number
  Low: number
  Close: number
  TotalTradedQuantity: number
  LastTradedQunatity?: number
  TotalBuyQuantity?: number
  TotalSellQuantity?: number
  AverageTradedPrice?: number
  LastTradedTime?: number
  LastUpdateTime?: number
  TotalValueTraded?: number | null
}

export interface MarketDepthQuote {
  Bids: Array<{
    Size: number
    Price: number
    TotalOrders: number
    BuyBackMarketMaker: number
  }>
  Asks: Array<{
    Size: number
    Price: number
    TotalOrders: number
    BuyBackMarketMaker: number
  }>
  Touchline?: {
    BidInfo: {
      Size: number
      Price: number
      TotalOrders: number
      BuyBackMarketMaker: number
    }
    AskInfo: {
      Size: number
      Price: number
      TotalOrders: number
      BuyBackMarketMaker: number
    }
  }
}

export interface OHLCQuote {
  DateTime: string
  Open: number
  High: number
  Low: number
  Close: number
  Volume: number
}

export interface MarketData {
  touchline: {
    listQuotes: string[] // JSON strings that need to be parsed
  }
  market_depth: {
    listQuotes: string[] // JSON strings that need to be parsed
  }
}

export interface HistoricalData {
  ohlc: {
    dataReponse: string // Pipe-separated string that needs to be parsed
  }
}

export interface StockDataResponse {
  type: string
  stock_info: StockInfo
  market_data: MarketData
  historical_data: HistoricalData
  timestamp: string
}

export interface StockDataRequest {
  stock_name: string
} 