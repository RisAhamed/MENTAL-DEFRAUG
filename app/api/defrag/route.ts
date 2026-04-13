import { NextRequest, NextResponse } from 'next/server'
import { classifyAndGenerateProtocol } from '@/lib/gemini'

const AI_TIMEOUT_MS = 10000

function timeout(ms: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), ms)
  })
}

function getErrorStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return Number((error as { status?: number }).status)
  }
  return undefined
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
      timeout(AI_TIMEOUT_MS),
    ])

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Defrag API error:', error)
    const statusCode = getErrorStatusCode(error)
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
