import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Make request to your backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const response = await fetch(`${backendUrl}/api/stock-analysis/stocks`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    })

    if (!response.ok) {
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
    console.error('Error fetching available stocks:', error)
    return NextResponse.json(
      { detail: `Failed to fetch available stocks: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
