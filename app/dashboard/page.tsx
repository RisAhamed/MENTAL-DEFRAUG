'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getOrCreateAnonymousUser, getUserStats } from '@/lib/user'
import { UserStats, FatigueType } from '@/types'

const FATIGUE_COLORS: Record<FatigueType, string> = {
  LOGIC: '#4CAF7D',
  NARRATIVE: '#3B6B9E',
  VISUAL: '#D4854A',
  EMOTIONAL: '#7B5EA7',
}

const FATIGUE_LABELS: Record<FatigueType, string> = {
  LOGIC: '💻 Logic',
  NARRATIVE: '📖 Narrative',
  VISUAL: '🎨 Visual',
  EMOTIONAL: '😓 Emotional',
}

interface Session {
  id: string
  fatigue_type: FatigueType
  intensity: string
  total_duration: number
  points_earned: number
  created_at: string
  feeling_after: string | null
}

interface BrainSummary {
  breakdown: Array<{ type: string; count: number }>
  weekTotal: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [brainSummary, setBrainSummary] = useState<BrainSummary | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
        setUserId(id)

        const userStats = await getUserStats(id)
        if (userStats) {
          setStats({
            totalPoints: userStats.total_points ?? 0,
            currentStreak: userStats.current_streak ?? 0,
            longestStreak: userStats.longest_streak ?? 0,
            lastDefragDate: userStats.last_defrag_date,
            badges: userStats.badges ?? [],
            totalSessions: userStats.total_sessions ?? 0,
            fatigueBreakdown: { LOGIC: 0, NARRATIVE: 0, VISUAL: 0, EMOTIONAL: 0 },
          })
        }

        // Fetch recent sessions
        const sessionsRes = await fetch(`/api/sessions?userId=${encodeURIComponent(id)}`)
        const sessionsData = await sessionsRes.json()
        if (sessionsData.sessions) {
          setSessions(sessionsData.sessions)
        }

        // Fetch brain summary
        const summaryRes = await fetch(`/api/brain-summary?userId=${encodeURIComponent(id)}`)
        const summaryData = await summaryRes.json()
        if (summaryData.breakdown) {
          setBrainSummary({
            breakdown: summaryData.breakdown,
            weekTotal: summaryData.weekTotal,
          })
        }

        // Fetch insight if user has 5+ sessions
        if ((userStats?.total_sessions ?? 0) >= 5) {
          const insightRes = await fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, totalSessions: userStats?.total_sessions }),
          })
          const insightData = await insightRes.json()
          setInsight(insightData.insight ?? null)
        }
      } catch (e) {
        console.error('[DASHBOARD] Error:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'HEAVY': return 'bg-red-500/30 text-red-300'
      case 'MODERATE': return 'bg-yellow-500/30 text-yellow-300'
      case 'LIGHT': return 'bg-green-500/30 text-green-300'
      default: return 'bg-white/10 text-white/50'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <p className="text-white/50">Loading...</p>
      </main>
    )
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-4 py-8 bg-[#0F0F0F]">
        <header className="flex items-center justify-between py-4">
          <button onClick={() => router.push('/')} className="text-white/50 hover:text-white">
            ←
          </button>
          <h1 className="text-lg font-semibold text-white">Your Brain Dashboard</h1>
          <div className="w-8" />
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-4xl mb-4">🌱</p>
          <p className="text-white/80 text-lg mb-2">You&apos;re just getting started</p>
          <p className="text-white/50 text-sm mb-6">Complete 3 sessions to see your pattern emerge.</p>
          <button
            onClick={() => router.push('/')}
            className="min-h-[44px] rounded-lg bg-[#4CAF7D] px-6 text-sm font-medium text-white"
          >
            Start Your First Defrag →
          </button>
        </div>
      </main>
    )
  }

  const thisWeekSessions = brainSummary?.weekTotal ?? 0
  const maxCount = Math.max(...(brainSummary?.breakdown.map(b => b.count) ?? [1]), 1)

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6 bg-[#0F0F0F]">
      {/* Header */}
      <header className="flex items-center justify-between py-4 sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-sm z-10">
        <button onClick={() => router.push('/')} className="text-white/50 hover:text-white text-lg">
          ←
        </button>
        <h1 className="text-lg font-semibold text-white">Your Brain Dashboard</h1>
        <button
          onClick={() => router.push('/settings')}
          className="text-white/50 hover:text-white text-sm"
        >
          ⚙️
        </button>
      </header>

      <div className="flex flex-col gap-6">
        {/* SECTION 1: Stats Overview */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.currentStreak}</p>
              <p className="text-xs text-[#A0A0A0] mt-1">day streak</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.totalPoints}</p>
              <p className="text-xs text-[#A0A0A0] mt-1">brain points</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-2xl font-bold text-[#F5F5F5]">{stats.totalSessions}</p>
              <p className="text-xs text-[#A0A0A0] mt-1">total sessions</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-2xl font-bold text-[#F5F5F5]">{thisWeekSessions}</p>
              <p className="text-xs text-[#A0A0A0] mt-1">this week</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: Fatigue Breakdown */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-[#A0A0A0] mb-3">
            This Week&apos;s Fatigue Pattern
          </h2>
          {brainSummary && brainSummary.breakdown.length > 0 ? (
            <div className="space-y-2">
              {brainSummary.breakdown.map((item) => {
                const color = FATIGUE_COLORS[item.type as FatigueType] ?? '#666'
                const percent = (item.count / maxCount) * 100
                return (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-[#A0A0A0]">
                      {FATIGUE_LABELS[item.type as FatigueType] ?? item.type}
                    </span>
                    <div className="flex-1 h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: `${color}B3` }}
                      />
                    </div>
                    <span className="text-xs text-white/50 w-16 text-right">
                      {item.count} sessions
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              No sessions this week yet.{' '}
              <button onClick={() => router.push('/')} className="text-[#4CAF7D]">
                Start your first defrag →
              </button>
            </p>
          )}
        </section>

        {/* SECTION 3: Recent Sessions */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-[#A0A0A0] mb-3">
            Recent Sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => {
                const color = FATIGUE_COLORS[session.fatigue_type as FatigueType] ?? '#666'
                return (
                  <div
                    key={session.id}
                    className="bg-[#1A1A1A] rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="text-sm text-white">
                          {formatDate(session.created_at)}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${getIntensityColor(
                            session.intensity
                          )}`}
                        >
                          {session.intensity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50">{session.total_duration} min</p>
                      <p className="text-xs text-[#4CAF7D]">+{session.points_earned}⚡</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              You&apos;re just getting started 🌱 Complete 3 sessions to see your pattern emerge.
            </p>
          )}
        </section>

        {/* SECTION 4: Weekly Insight */}
        {insight && (
          <section>
            <h2 className="text-sm uppercase tracking-wider text-[#A0A0A0] mb-3">
              Latest Brain Insight
            </h2>
            <div className="bg-gradient-to-br from-[#4CAF7D]/10 to-transparent rounded-2xl p-5 border border-[#4CAF7D]/25">
              <p className="text-lg text-white/80 italic">✨ {insight}</p>
              <p className="text-xs text-white/40 mt-3">
                Based on your last 5 sessions
              </p>
            </div>
          </section>
        )}

        {/* SECTION 5: Email Subscription Status */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-[#A0A0A0] mb-3">
            Weekly Digest
          </h2>
          <div className="bg-[#1A1A1A] rounded-xl px-4 py-4 border border-[rgba(255,255,255,0.08)]">
            <p className="text-white/50">
              💾 Connect your email in Settings to receive weekly brain reports
            </p>
          </div>
        </section>

        {/* SECTION 6: Navigation to Settings */}
        <section>
          <button
            onClick={() => router.push('/settings')}
            className="w-full bg-[#1A1A1A] rounded-xl px-4 py-4 border border-[rgba(255,255,255,0.08)] text-left flex items-center justify-between"
          >
            <span className="text-white">⚙️ Settings & Preferences</span>
            <span className="text-white/50">→</span>
          </button>
        </section>
      </div>
    </main>
  )
}