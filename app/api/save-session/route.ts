import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculatePoints, calculateStreak, checkNewBadges, updateUserStats } from '@/lib/points'

export async function POST(request: NextRequest) {
  try {
    const { userId, inputText, fatigueType, intensity, protocol, timerCompleted } = await request.json()

    if (!userId || !fatigueType || !intensity || !protocol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: existingTodayCount, error: todayCountError },
      { count: existingTotalCount, error: totalCountError },
      { data: userData, error: userError },
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('users')
        .select('current_streak, longest_streak, last_defrag_date, badges, total_points, email')
        .eq('id', userId)
        .single(),
    ])

    if (todayCountError) throw todayCountError
    if (totalCountError) throw totalCountError
    if (userError) throw userError

    const todaySessionCount = (existingTodayCount ?? 0) + 1
    const totalSessions = (existingTotalCount ?? 0) + 1

    const currentStreak = userData?.current_streak ?? 0
    const lastDefragDate = userData?.last_defrag_date ?? null
    const currentBadges: string[] = userData?.badges ?? []

    // Calculate points and streak
    const pointsEarned = calculatePoints(timerCompleted, todaySessionCount)
    const newStreak = calculateStreak(lastDefragDate, currentStreak)
    const newBadges = checkNewBadges(currentBadges, newStreak, totalSessions)

    // Insert session
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        input_text: inputText,
        fatigue_type: fatigueType,
        intensity,
        protocol,
        timer_completed: timerCompleted,
        feeling_after: null,
        points_earned: pointsEarned,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Update user stats
    const updatedStats = await updateUserStats(userId, pointsEarned, newStreak, newBadges)
    const longestStreak = updatedStats?.longestStreak ?? Math.max(userData?.longest_streak ?? 0, newStreak)
    const totalPoints = updatedStats?.totalPoints ?? (userData?.total_points ?? 0) + pointsEarned

    return NextResponse.json({
      sessionId: session.id,
      pointsEarned,
      newStreak,
      longestStreak,
      newBadges,
      totalPoints,
      totalSessions,
      todaySessionCount,
      userEmail: userData?.email ?? null,
    })
  } catch (error) {
    console.error('Save session error:', error)
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    )
  }
}
