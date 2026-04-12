import { NextRequest, NextResponse } from 'next/server'
import { classifyAndGenerateProtocol } from '@/lib/gemini'

function timeout(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), ms)
  })
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string' || input.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe what you were doing (at least 10 characters)' },
        { status: 400 }
      )
    }

    const protocol = await Promise.race([
      classifyAndGenerateProtocol(input.trim()),
      timeout(10000),
    ])

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Defrag API error:', error)
    const statusCode = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined
    const message = error instanceof Error ? error.message.toLowerCase() : ''

    if (message.includes('timeout')) {
      return NextResponse.json(
        { error: 'timeout', message: 'Analysis took too long' },
        { status: 504 }
      )
    }

    if (statusCode === 429 || message.includes('429') || message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'rate_limit', message: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'ai_failed', message: 'Could not analyse your session' },
      { status: 500 }
    )
  }
}
