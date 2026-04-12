import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId')

  try {
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const statsQuery = supabase
      .from('users')
      .select('total_points, current_streak, longest_streak, last_defrag_date, badges, email, first_name')
      .eq('id', userId)
      .single()
    const [{ data: statsWithFirstName, error: statsError }, { count, error: countError }] = await Promise.all([
      statsQuery,
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    if (countError) throw countError

    let stats = statsWithFirstName
    if (statsError) {
      const fallback = await supabase
        .from('users')
        .select('total_points, current_streak, longest_streak, last_defrag_date, badges, email')
        .eq('id', userId)
        .single()

      if (fallback.error) throw fallback.error
      stats = { ...fallback.data, first_name: null }
    }

    if (!stats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      stats: {
        totalPoints: stats.total_points ?? 0,
        currentStreak: stats.current_streak ?? 0,
        longestStreak: stats.longest_streak ?? 0,
        lastDefragDate: stats.last_defrag_date ?? null,
        badges: stats.badges ?? [],
        email: stats.email ?? null,
        firstName: stats.first_name ?? null,
        total_points: stats.total_points ?? 0,
        current_streak: stats.current_streak ?? 0,
        longest_streak: stats.longest_streak ?? 0,
        last_defrag_date: stats.last_defrag_date ?? null,
        first_name: stats.first_name ?? null,
      },
      sessionCount: count ?? 0,
    })
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load user stats' },
      { status: 500 }
    )
  }
}
