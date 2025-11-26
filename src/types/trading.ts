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

export interface SquareOffResponse {
  status: string
  message: string
}

