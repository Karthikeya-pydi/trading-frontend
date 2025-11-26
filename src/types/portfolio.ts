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
    raw_score: number | null  
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

