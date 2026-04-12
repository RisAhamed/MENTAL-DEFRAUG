import { createAdminClient } from '@/lib/supabase/admin'
import { BADGES } from '@/lib/badges'

export function calculatePoints(
  timerCompleted: boolean,
  todaySessionCount: number
): number {
  if (!timerCompleted) return 5
  if (todaySessionCount === 1) return 10
  if (todaySessionCount === 2) return 15
  return 20
}

export function calculateStreak(
  lastDefragDate: string | null,
  currentStreak: number
): number {
  if (!lastDefragDate) return 1

  const last = new Date(lastDefragDate)
  const today = new Date()
  last.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor(
    (today.getTime() - last.getTime()) / 86400000
  )

  if (diffDays === 0) return currentStreak
  if (diffDays === 1) return currentStreak + 1
  return 1
}

export function checkNewBadges(
  currentBadges: string[],
  newStreak: number,
  totalSessions: number
): string[] {
  const earned: string[] = []

  if (totalSessions >= 1 && !currentBadges.includes(BADGES.FIRST_DEFRAG.id))
    earned.push(BADGES.FIRST_DEFRAG.id)
  if (newStreak >= 3 && !currentBadges.includes(BADGES.THREE_DAY_STREAK.id))
    earned.push(BADGES.THREE_DAY_STREAK.id)
  if (newStreak >= 7 && !currentBadges.includes(BADGES.SEVEN_DAY_STREAK.id))
    earned.push(BADGES.SEVEN_DAY_STREAK.id)
  if (newStreak >= 14 && !currentBadges.includes(BADGES.FOURTEEN_DAY_STREAK.id))
    earned.push(BADGES.FOURTEEN_DAY_STREAK.id)
  if (totalSessions >= 10 && !currentBadges.includes(BADGES.TEN_SESSIONS.id))
    earned.push(BADGES.TEN_SESSIONS.id)

  return earned
}

export async function updateUserStats(
  userId: string,
  pointsEarned: number,
  newStreak: number,
  newBadges: string[]
): Promise<{ totalPoints: number; longestStreak: number; badges: string[] } | null> {
  const supabase = createAdminClient()

  const stats = await supabase
    .from('users')
    .select('total_points, longest_streak, badges')
    .eq('id', userId)
    .single()

  if (!stats.data) return null

  const updatedBadges = [...new Set([...(stats.data.badges || []), ...newBadges])]
  const totalPoints = (stats.data.total_points || 0) + pointsEarned
  const longestStreak = Math.max(stats.data.longest_streak || 0, newStreak)

  const { error } = await supabase
    .from('users')
    .update({
      total_points: totalPoints,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_defrag_date: new Date().toISOString().split('T')[0],
      badges: updatedBadges,
    })
    .eq('id', userId)

  if (error) throw error

  return { totalPoints, longestStreak, badges: updatedBadges }
}
