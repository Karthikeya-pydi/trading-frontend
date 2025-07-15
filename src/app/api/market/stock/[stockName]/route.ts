import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { stockName: string } }
) {
  try {
    // Optional: Add authentication check here if needed
    // const authHeader = request.headers.get('authorization')
    // if (!authHeader) {
    //   return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
    // }

    const stockName = params.stockName.toUpperCase()
    
    // Mock data for testing - replace with actual IIFL API calls
    const mockStockData = {
      type: "success",
      stock_info: {
        name: `${stockName} Industries Limited`,
        symbol: stockName,
        exchange_segment: 1,
        instrument_id: "2885",
        series: "EQ",
        isin: "INE002A01018",
        lot_size: "250",
        tick_size: "0.05",
        price_band_high: "2500.00",
        price_band_low: "2000.00"
      },
      market_data: {
        touchline: {
          listQuotes: [{
            LastTradedPrice: 2450.50,
            Change: 25.50,
            ChangeInPercentage: 1.05,
            Open: 2425.00,
            High: 2460.00,
            Low: 2410.00,
            Close: 2425.00,
            TotalQtyTraded: 1500000
          }]
        },
        market_depth: {
          listQuotes: [
            { BidPrice: 2450.00, BidQty: 500, AskPrice: 2451.00, AskQty: 300 },
            { BidPrice: 2449.00, BidQty: 750, AskPrice: 2452.00, AskQty: 400 },
            { BidPrice: 2448.00, BidQty: 600, AskPrice: 2453.00, AskQty: 350 },
            { BidPrice: 2447.00, BidQty: 800, AskPrice: 2454.00, AskQty: 450 },
            { BidPrice: 2446.00, BidQty: 900, AskPrice: 2455.00, AskQty: 500 }
          ]
        }
      },
      historical_data: {
        ohlc: {
          listQuotes: [
            { DateTime: "2024-01-15", Open: 2425.00, High: 2460.00, Low: 2410.00, Close: 2450.50, Volume: 1500000 },
            { DateTime: "2024-01-14", Open: 2410.00, High: 2430.00, Low: 2400.00, Close: 2425.00, Volume: 1200000 },
            { DateTime: "2024-01-13", Open: 2400.00, High: 2420.00, Low: 2390.00, Close: 2410.00, Volume: 1100000 },
            { DateTime: "2024-01-12", Open: 2390.00, High: 2410.00, Low: 2380.00, Close: 2400.00, Volume: 1000000 },
            { DateTime: "2024-01-11", Open: 2380.00, High: 2400.00, Low: 2370.00, Close: 2390.00, Volume: 900000 }
          ]
        }
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(mockStockData)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { detail: `Failed to fetch stock data for '${params.stockName}'` },
      { status: 500 }
    )
  }
} 