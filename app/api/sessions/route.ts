import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ sessions: [] }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('sessions')
      .select('id, fatigue_type, intensity, total_duration, points_earned, created_at, feeling_after')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[SESSIONS] Error fetching:', error)
      return NextResponse.json({ sessions: [] })
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error('[SESSIONS] Error:', error)
    return NextResponse.json({ sessions: [] })
  }
}