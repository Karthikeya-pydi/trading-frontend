import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    
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
    const response = await fetch(`${backendUrl}/api/market/bhavcopy/file/${filename}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { detail: `Bhavcopy file '${filename}' not found` },
          { status: 404 }
        )
      }
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching bhavcopy file data:', error)
    return NextResponse.json(
      { detail: `Failed to load bhavcopy data from '${params.filename}'` },
      { status: 500 }
    )
  }
}
