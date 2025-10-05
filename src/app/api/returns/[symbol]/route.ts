import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authorization header is required' },
        { status: 401 }
      )
    }
    
    // Make request to your backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const url = `${backendUrl}/api/returns/${symbol}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            status: 'error',
            message: `No returns data found for symbol: ${symbol}`,
            symbol: symbol
          },
          { status: 404 }
        )
      }
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching returns data for symbol:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: `Failed to load returns data for symbol: ${params.symbol}`,
        symbol: params.symbol
      },
      { status: 500 }
    )
  }
}
