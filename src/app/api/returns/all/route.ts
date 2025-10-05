import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort_by') || '1_Year'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const limit = searchParams.get('limit')
    
    // Build query string
    const queryParams = new URLSearchParams()
    if (sortBy) queryParams.append('sort_by', sortBy)
    if (sortOrder) queryParams.append('sort_order', sortOrder)
    if (limit) queryParams.append('limit', limit)
    
    const queryString = queryParams.toString()
    
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
    const url = `${backendUrl}/api/returns/all${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { detail: 'No returns data found' },
          { status: 404 }
        )
      }
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching all returns data:', error)
    return NextResponse.json(
      { detail: 'Failed to load returns data' },
      { status: 500 }
    )
  }
}
