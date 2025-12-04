// Strategy Builder Types

export interface Underlying {
  underlying: string
  exchange_segment: string
}

export interface ExpiryDate {
  expiry_date: string
}

export interface OptionChainItem {
  strike: number
  ce?: OptionData
  pe?: OptionData
}

export interface OptionData {
  ExchangeInstrumentID: number
  Name: string
  LTP?: number
  Bid?: number
  Ask?: number
  High?: number
  Low?: number
  Volume?: number
  OpenInterest?: number
  Change?: number
  ChangePercent?: number
  IV?: number
}

export interface OptionChain {
  type: string
  underlying: string
  spot_price: number
  option_chain: OptionChainItem[]
}

export interface StrategyPosition {
  position_id?: string
  instrument_id: number
  instrument_name: string
  option_type: 'CE' | 'PE'
  strike: number
  quantity: number
  side: 'BUY' | 'SELL'
  avg_price: number
  current_price?: number
  unrealized_pnl?: number
  realized_pnl?: number
}

export interface Strategy {
  strategy_id: string
  strategy_name: string
  underlying: string
  expiry_date: string
  strategy_type: 'straddle' | 'strangle' | 'iron_condor' | 'butterfly' | 'custom'
  positions: StrategyPosition[]
  total_pnl?: number
  created_at?: string
  updated_at?: string
}

export interface CreateStrategyRequest {
  strategy_name: string
  underlying: string
  expiry_date: string
  strategy_type: 'straddle' | 'strangle' | 'iron_condor' | 'butterfly' | 'custom'
}

export interface CreateStraddleRequest {
  underlying: string
  expiry_date: string
  strike: number
  quantity: number
}

export interface AddPositionRequest {
  instrument_id: number
  instrument_name: string
  option_type: 'CE' | 'PE'
  strike: number
  quantity: number
  side: 'BUY' | 'SELL'
  avg_price: number
}

export interface WebSocketMessage {
  type: string
  data?: any
  error?: string
}

export interface MarketDataMessage extends WebSocketMessage {
  type: 'market_data'
  data: {
    stock_name: string
    LTP?: number
    High?: number
    Low?: number
    Bid?: number
    Ask?: number
    Volume?: number
    Change?: number
    ChangePercent?: number
  }
}

export interface StrategyPnLMessage extends WebSocketMessage {
  type: 'strategy_pnl' | 'strategy_data'
  data: {
    strategy_id: string
    positions: StrategyPosition[]
    total_pnl: number
  }
}

