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
  // Primary fields from API
  id: number
  underlying_instrument: string
  option_type: string | null
  strike_price: number | null
  expiry_date: string | null
  quantity: number
  average_price: number
  current_price: number | null
  unrealized_pnl: number
  stop_loss_price: number | null
  stop_loss_active: boolean
  
  // Legacy fields for backward compatibility
  ltp?: number
  pnl?: number
  avg_price?: number
  symbol?: string
  position_id?: number
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
  order_id: string | number  // Allow both string and number types
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
  // Frontend processed structure
  instrument: string
  quantity: number
  average_price: number
  current_price: number
  market_value: number
  invested_value: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  
  // Backend IIFL structure fields
  ISIN?: string
  HoldingQuantity?: number
  BuyAvgPrice?: number
  LTP?: number
  ExchangeNSEInstrumentId?: number
  CreatedOn?: string
  IsCollateralHolding?: boolean
  
  // Holdings summary structure fields
  stock_name?: string
  purchase_date?: string
  is_collateral?: boolean
  nse_instrument_id?: number
}

export interface PortfolioSummary {
  // Backend API response structure
  total_positions: number
  long_positions: number
  short_positions: number
  total_investment: number
  current_value: number
  unrealized_pnl: number
  daily_pnl: number
  monthly_pnl: number
  positions: Array<{
    underlying: string
    option_type: string
    strike_price: number
    quantity: number
    average_price: number
    current_price: number
    unrealized_pnl: number
    position_type: string
  }>
  
  // Legacy frontend fields (for backward compatibility)
  total_value?: number
  total_pnl?: number
  day_pnl?: number
  positions_count?: number
  available_margin?: number
  realized_pnl?: number
}

export interface PnLData {
  // Backend API response structure
  total_realized_pnl: number
  total_unrealized_pnl: number
  total_pnl: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_charges: number
  
  // Legacy frontend fields (for backward compatibility)
  realized_pnl?: number
  unrealized_pnl?: number
  day_pnl?: number
  positions?: Array<{
    instrument: string
    quantity: number
    average_price: number
    current_price: number
    unrealized_pnl: number
    pnl_percentage: number
  }>
}

export interface HoldingsSummary {
  // Backend API response structure
  total_holdings: number
  total_investment: number
  total_current_value: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  holdings: Array<{
    stock_name: string
    isin: string
    quantity: number
    average_price: number
    investment_value: number
    purchase_date: string
    is_collateral: boolean
    nse_instrument_id: number
    current_price: number
    current_value: number
    unrealized_pnl: number
    unrealized_pnl_percent: number
  }>
  
  // Legacy frontend fields (for backward compatibility)
  total_invested?: number
  current_value?: number
  total_pnl?: number
  total_pnl_percentage?: number
  day_pnl?: number
  day_pnl_percentage?: number
}

export interface HoldingsSummaryResponse {
  status: string
  summary: HoldingsSummary
  message: string
}

export interface DailyPnL {
  // Backend API response structure
  date: string
  daily_pnl: number
  realized_pnl: number
  unrealized_pnl: number
  trades_count: number
  win_rate: number
  
  // Legacy frontend fields (for backward compatibility)
  opening_value?: number
  closing_value?: number
  day_pnl_percentage?: number
}

export interface RiskMetrics {
  // Backend API response structure
  net_exposure: number
  gross_exposure: number
  long_exposure: number
  short_exposure: number
  concentration_risk_percent: number
  positions_at_risk: number
  total_unrealized_loss: number
  portfolio_diversity: number
  
  // Legacy frontend fields (for backward compatibility)
  portfolio_value?: number
  total_exposure?: number
  available_margin?: number
  margin_utilization?: number
  max_loss?: number
  risk_percentage?: number
  concentration_risk?: {
    top_holding_percentage: number
    top_3_holdings_percentage: number
  }
}

export interface UpdatePricesResponse {
  message: string
  total_positions: number
  updated_positions: number
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

export interface StockAnalytics {
  symbol: string
  current_price: number
  market_cap: number | null
  returns: {
    "1d": number
    "1w": number
    "1m": number
    "6m": number
    "1y": number
  }
  cagr: {
    "5y": number
  }
  gap_with_nifty: {
    "1w": number
    "1m": number
    "6m": number
    "1y": number
    "5y_cagr": number
  }
}

export interface StockDataResponse {
  type: string
  stock_info: StockInfo
  market_data: MarketData
  historical_data: HistoricalData
  analytics?: StockAnalytics
  timestamp: string
}

export interface StockDataRequest {
  stock_name: string
}

// =============================================================================
// IIFL BALANCE TYPES
// =============================================================================

export interface IIFLBalance {
  type: string
  code: string
  description: string
  result: {
    BalanceList: Array<{
      limitHeader: string
      limitObject: {
        RMSSubLimits: {
          cashAvailable: string
          collateral: number
          marginUtilized: string
          netMarginAvailable: string
          MTM: string
          UnrealizedMTM: string
          RealizedMTM: string
        }
        marginAvailable: {
          CashMarginAvailable: string
          AdhocMargin: string
          NotinalCash: string
          PayInAmount: string
          PayOutAmount: string
          CNCSellBenifit: string
          DirectCollateral: string
          HoldingCollateral: string
          ClientBranchAdhoc: string
          SellOptionsPremium: string
          NetOptionPremium: string
          BuyOptionsPremium: string
          TotalBranchAdhoc: string
          AdhocFOMargin: string
          AdhocCurrencyMargin: string
          AdhocCommodityMargin: string
        }
        marginUtilized: {
          GrossExposureMarginPresent: string
          BuyExposureMarginPresent: string
          SellExposureMarginPresent: string
          VarELMarginPresent: string
          ScripBasketMarginPresent: string
          GrossExposureLimitPresent: string
          BuyExposureLimitPresent: string
          SellExposureLimitPresent: string
          CNCLimitUsed: string
          CNCAmountUsed: string
          MarginUsed: string
          LimitUsed: string
          TotalSpanMargin: string
          ExposureMarginPresent: string
        }
        limitsAssigned: {
          CNCLimit: string
          TurnoverLimitPresent: string
          MTMLossLimitPresent: string
          BuyExposureLimit: string
          SellExposureLimit: string
          GrossExposureLimit: string
          GrossExposureDerivativesLimit: string
          BuyExposureFuturesLimit: string
          BuyExposureOptionsLimit: string
          SellExposureOptionsLimit: string
          SellExposureFuturesLimit: string
          AdhocOptionsBuy: string
          AdhocCashCNCMargin: string
        }
        AccountID: string
      }
    }>
  }
}

export interface BalanceResponse {
  status: string
  balance: IIFLBalance
  message: string
} 

// =============================================================================
// BHAVCOPY DATA TYPES
// =============================================================================

export interface BhavcopyRecord {
  SYMBOL: string
  SERIES: string
  DATE1: string
  PREV_CLOSE: number
  OPEN_PRICE: number
  HIGH_PRICE: number
  LOW_PRICE: number
  LAST_PRICE: number
  CLOSE_PRICE: number
  AVG_PRICE: number
  TTL_TRD_QNTY: number
  TURNOVER_LACS: number
  NO_OF_TRADES: number
  DELIV_QTY: number | string
  DELIV_PER: number | string
}

export interface BhavcopyResponse {
  message: string
  total_records: number
  data: BhavcopyRecord[]
}

// =============================================================================
// END OF TYPES
// ============================================================================= 