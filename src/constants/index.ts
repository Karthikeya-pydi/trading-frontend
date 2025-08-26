export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETUP: '/setup',
  MARKET: '/market',
  TRADING: '/trading',
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
  
  // New Trading Endpoints
  TRADING_SEARCH_STOCKS: '/api/trading/search-stocks',
  TRADING_BUY_STOCK: '/api/trading/buy-stock',
  TRADING_STOCK_QUOTE: '/api/trading/stock-quote',
  
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
  
  // Bhavcopy Data
  BHAVCOPY_DATA: '/api/market/bhavcopy',
  
  // Nifty Indices Data
  NIFTY_INDICES: '/api/market/nifty/indices',
  NIFTY_INDEX_DATA: '/api/market/nifty',
  NIFTY_INDEX_CONSTITUENTS: '/api/market/nifty',
  
  // Returns Data (New endpoints)
  RETURNS_STOCK: '/api/returns/stock',
  RETURNS_ALL: '/api/returns/all',
  RETURNS_SUMMARY: '/api/returns/summary',
  RETURNS_SEARCH: '/api/returns/search',
  RETURNS_TOP_PERFORMERS: '/api/returns/top-performers',
  RETURNS_BOTTOM_PERFORMERS: '/api/returns/bottom-performers',
  RETURNS_REFRESH: '/api/returns/refresh',
  
  // Portfolio Returns (Portfolio context)
  PORTFOLIO_RETURNS_STOCK: '/api/portfolio/returns/stock',
  PORTFOLIO_RETURNS_SUMMARY: '/api/portfolio/returns/summary',
  PORTFOLIO_RETURNS_TOP_PERFORMERS: '/api/portfolio/returns/top-performers',
  
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

export const TRADING_CONFIG = {
  DEFAULT_QUANTITY: 1,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000000,
  PRICE_PRECISION: 2,
  QUANTITY_PRECISION: 0,
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  ORDER_CONFIRMATION_TIMEOUT: 10000 // 10 seconds
} as const 