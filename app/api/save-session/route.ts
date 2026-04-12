import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculatePoints, calculateStreak, checkNewBadges, updateUserStats } from '@/lib/points'

const BASE_RETRY_DELAY_MS = 500

async function insertWithRetry(
  supabase: ReturnType<typeof createAdminClient>,
  sessionData: {
    user_id: string
    input_text: string
    fatigue_type: string
    intensity: string
    protocol: unknown
    timer_completed: boolean
    feeling_after: null
    points_earned: number
  },
  maxRetries = 2
) {
  for (let i = 0; i <= maxRetries; i++) {
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select('id')
      .single()

    if (!error) return { data, error: null }
    if (i === maxRetries) return { data: null, error }
    await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * (i + 1)))
  }
  return { data: null, error: new Error('Insert retries exhausted') }
}

async function updateStatsWithRetry(
  userId: string,
  pointsEarned: number,
  newStreak: number,
  newBadges: string[],
  maxRetries = 2
) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const data = await updateUserStats(userId, pointsEarned, newStreak, newBadges)
      return { data, error: null }
    } catch (error) {
      if (i === maxRetries) {
        return { data: null, error: error as Error }
      }
      await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * (i + 1)))
    }
  }
  return { data: null, error: new Error('Update retries exhausted') }
}

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

    const sessionData = {
      user_id: userId,
      input_text: inputText,
      fatigue_type: fatigueType,
      intensity,
      protocol,
      timer_completed: timerCompleted,
      feeling_after: null,
      points_earned: pointsEarned,
    }

    const { data: session, error: insertError } = await insertWithRetry(supabase, sessionData)
    if (insertError || !session) {
      console.error('Save session insert failed after retries:', insertError)
      return NextResponse.json(
        {
          sessionId: null,
          pointsEarned: 5,
          newStreak: 0,
          newBadges: [],
          error: 'session_save_failed',
        },
        { status: 207 }
      )
    }

    // Update user stats
    const { data: updatedStats, error: updateError } = await updateStatsWithRetry(
      userId,
      pointsEarned,
      newStreak,
      newBadges
    )
    if (updateError) {
      console.error('Save session stats update failed after retries:', updateError)
      return NextResponse.json(
        {
          sessionId: null,
          pointsEarned: 5,
          newStreak: 0,
          newBadges: [],
          error: 'session_save_failed',
        },
        { status: 207 }
      )
    }

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
