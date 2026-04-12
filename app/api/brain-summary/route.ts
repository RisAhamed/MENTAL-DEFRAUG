import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId')

  try {
    if (!userId) {
      return NextResponse.json({ breakdown: [], totalSessions: 0, weekTotal: 0 })
    }

    const supabase = createAdminClient()
    const { count: totalSessions, error: totalError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (totalError) throw totalError

    if ((totalSessions ?? 0) < 3) {
      return NextResponse.json({ breakdown: [], totalSessions: totalSessions ?? 0, weekTotal: 0 })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('sessions')
      .select('fatigue_type')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)

    if (error) throw error

    const counts = new Map<string, number>()
    for (const session of data ?? []) {
      const fatigueType = session.fatigue_type
      if (fatigueType) {
        counts.set(fatigueType, (counts.get(fatigueType) ?? 0) + 1)
      }
    }

    const breakdown = [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
    const weekTotal = breakdown.reduce((total, item) => total + item.count, 0)

    return NextResponse.json({ breakdown, totalSessions: totalSessions ?? 0, weekTotal })
  } catch (error) {
    console.error('Brain summary error:', error)
    return NextResponse.json({ breakdown: [], totalSessions: 0, weekTotal: 0 })
  }
}
