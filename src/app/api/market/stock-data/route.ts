import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stock_name } = body

    if (!stock_name) {
      return NextResponse.json(
        { detail: "stock_name is required" },
        { status: 400 }
      )
    }

    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Make request to your backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const response = await fetch(`${backendUrl}/api/market/stock-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      },
      body: JSON.stringify({ stock_name: stock_name.toUpperCase() })
    })

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { detail: `Failed to fetch stock data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 