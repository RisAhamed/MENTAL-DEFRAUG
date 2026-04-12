import { NextRequest, NextResponse } from 'next/server'
import { classifyAndGenerateProtocol } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string' || input.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe what you were doing (at least 10 characters)' },
        { status: 400 }
      )
    }

    const protocol = await classifyAndGenerateProtocol(input.trim())

    const response = NextResponse.json(protocol)

    // Store protocol in httpOnly cookie for result/timer pages (30 min expiry)
    response.cookies.set('defrag_protocol', JSON.stringify(protocol), {
      httpOnly: false,
      maxAge: 1800,
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Defrag API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze fatigue. Please try again.' },
      { status: 500 }
    )
  }
}