import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { detail: "symbol parameter is required" },
        { status: 400 }
      )
    }

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Make request to your backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const response = await fetch(`${backendUrl}/api/stock-analysis/search?symbol=${encodeURIComponent(symbol.toUpperCase())}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { detail: `No data found for stock: ${symbol.toUpperCase()}` },
          { status: 404 }
        )
      }
      if (response.status === 401) {
        return NextResponse.json(
          { detail: "Not authenticated" },
          { status: 401 }
        )
      }
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching stock analysis:', error)
    return NextResponse.json(
      { detail: `Error analyzing stock ${searchParams.get('symbol')?.toUpperCase() || 'UNKNOWN'}: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
