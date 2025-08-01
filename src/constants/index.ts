export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETUP: '/setup',
  MARKET: '/market',
  AUTH_CALLBACK: '/auth/callback'
} as const

export const ORDER_TYPES = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  SL: 'SL',
  SLM: 'SLM'
} as const

export const ORDER_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL'
} as const

export const TAB_KEYS = {
  PORTFOLIO: 'portfolio',
  ORDERS: 'orders',
  TRADES: 'trades',
  MARKET: 'market'
} as const

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token'
} as const

export const API_ENDPOINTS = {
  // Auth
  AUTH_ME: '/api/auth/me',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_LOGOUT: '/api/auth/logout',
  GOOGLE_OAUTH: '/api/auth/oauth/google/login',
  GOOGLE_CALLBACK: '/api/auth/oauth/google/callback',
  
  // User
  USER_PROFILE: '/api/users/me',
  SET_IIFL_CREDENTIALS: '/api/users/set-iifl-credentials',
  IIFL_CREDENTIALS: '/api/users/iifl-credentials',
  
  // Trading (Updated to match backend)
  PLACE_ORDER: '/api/trading/place-order',
  POSITIONS: '/api/trading/positions',
  TRADES: '/api/trading/trades',
  ORDER_BOOK: '/api/trading/order-book',
  CANCEL_ORDER: '/api/trading/orders',  // Used with /{order_id}/cancel
  MODIFY_ORDER: '/api/trading/orders',  // Used with /{order_id}/modify
  SQUARE_OFF: '/api/trading/positions', // Used with /{position_id}/square-off
  
  // Portfolio (Updated to match backend)
  PORTFOLIO_SUMMARY: '/api/portfolio/summary',
  PORTFOLIO_PNL: '/api/portfolio/pnl',
  PORTFOLIO_UPDATE_PRICES: '/api/portfolio/update-prices',
  PORTFOLIO_RISK_METRICS: '/api/portfolio/risk-metrics',
  PORTFOLIO_DAILY_PNL: '/api/portfolio/daily-pnl',
  PORTFOLIO_HOLDINGS: '/api/portfolio/holdings',
  PORTFOLIO_HOLDINGS_SUMMARY: '/api/portfolio/holdings-summary',
  
  // Market Data (Updated to match backend)
  MARKET_SEARCH_INSTRUMENTS: '/api/market/instruments/search',
  MARKET_GET_QUOTES: '/api/market/market-data',
  MARKET_GET_LTP: '/api/market/ltp',
  MARKET_INSTRUMENT_MASTER: '/api/market/instruments/master',
  MARKET_INFO: '/api/market',
  
  // Stock Data (New endpoints)
  STOCK_DATA_GET: '/api/market/stock',  // Used with /{stock_name}
  STOCK_DATA_POST: '/api/market/stock-data',
  
  // IIFL Integration
  IIFL_MARKET_CREDENTIALS: '/api/iifl/credentials/market',
  IIFL_INTERACTIVE_CREDENTIALS: '/api/iifl/credentials/interactive',
  IIFL_VALIDATE_CREDENTIALS: '/api/iifl/credentials/validate',
  IIFL_BALANCE: '/api/iifl/balance',
  
  // Health
  HEALTH: '/health'
} as const

export const EXCHANGE_SEGMENTS = {
  NSECM: 'NSECM',  // NSE Capital Market
  NSEFO: 'NSEFO',  // NSE Futures & Options
  BSECM: 'BSECM',  // BSE Capital Market
  BSEFO: 'BSEFO'   // BSE Futures & Options
} as const

export const INSTRUMENT_TYPES = {
  EQ: 'EQ',        // Equity
  FUTCOM: 'FUTCOM', // Futures Commodity
  OPTIDX: 'OPTIDX', // Options Index
  FUTSTK: 'FUTSTK', // Futures Stock
  OPTSTK: 'OPTSTK'  // Options Stock
} as const

export const MARKET_CONFIG = {
  DEFAULT_SEARCH_LIMIT: 10,
  REALTIME_UPDATE_INTERVAL: 5000, // 5 seconds
  MAX_WATCHLIST_ITEMS: 50,
  SEARCH_DEBOUNCE_MS: 300
} as const 