import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, feelingAfter } = await request.json()

    if (!sessionId || !feelingAfter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('sessions')
      .update({ feeling_after: feelingAfter })
      .eq('id', sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save feeling error:', error)
    return NextResponse.json(
      { error: 'Failed to save feeling' },
      { status: 500 }
    )
  }
}