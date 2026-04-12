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
        points_earned: 0,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Get today's session count for this user
    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    const todaySessionCount = (todayCount ?? 0)

    // Get total session count
    const { count: totalCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const totalSessions = totalCount ?? 0

    // Get user stats for streak/badge calculation
    const { data: userData } = await supabase
      .from('users')
      .select('current_streak, last_defrag_date, badges')
      .eq('id', userId)
      .single()

    const currentStreak = userData?.current_streak ?? 0
    const lastDefragDate = userData?.last_defrag_date ?? null
    const currentBadges: string[] = userData?.badges ?? []

    // Calculate points and streak
    const pointsEarned = calculatePoints(timerCompleted, todaySessionCount)
    const newStreak = calculateStreak(lastDefragDate, currentStreak)
    const newBadges = checkNewBadges(currentBadges, newStreak, totalSessions)

    // Update the session with points
    await supabase
      .from('sessions')
      .update({ points_earned: pointsEarned })
      .eq('id', session.id)

    // Update user stats
    await updateUserStats(userId, pointsEarned, newStreak, newBadges)

    return NextResponse.json({
      sessionId: session.id,
      pointsEarned,
      newStreak,
      newBadges,
    })
  } catch (error) {
    console.error('Save session error:', error)
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    )
  }
}
