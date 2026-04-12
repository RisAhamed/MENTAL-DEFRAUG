import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId')

  try {
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const [{ data: stats, error: statsError }, { count, error: countError }] = await Promise.all([
      supabase
        .from('users')
        .select('total_points, current_streak, longest_streak, last_defrag_date, badges, email')
        .eq('id', userId)
        .single(),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    if (statsError) throw statsError
    if (countError) throw countError

    return NextResponse.json({ stats, sessionCount: count ?? 0 })
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load user stats' },
      { status: 500 }
    )
  }
}
