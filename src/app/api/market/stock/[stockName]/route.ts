import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { stockName: string } }
) {
  try {
    const stockName = params.stockName.toUpperCase()
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Make request to your backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${backendUrl}/api/market/stock/${stockName}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    })

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { detail: `Failed to fetch stock data for '${params.stockName}'` },
      { status: 500 }
    )
  }
} 