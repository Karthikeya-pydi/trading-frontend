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

