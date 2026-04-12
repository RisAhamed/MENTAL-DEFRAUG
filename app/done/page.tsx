'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { StreakDisplay } from '@/components/StreakDisplay'
import { FeelingCheck } from '@/components/FeelingCheck'
import { EmailCapture } from '@/components/EmailCapture'
import { getOrCreateAnonymousUser, getUserStats, getUserSessionCount } from '@/lib/user'
import { UserStats, FeelingAfter } from '@/types'

interface SessionResult {
  sessionId: string
  pointsEarned: number
  newStreak: number
  newBadges: string[]
}

export default function DonePage() {
  const router = useRouter()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [feelingSubmitted, setFeelingSubmitted] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
        setUserId(id)

        // Read session result from cookie
        let sessionResult: SessionResult | null = null
        const stored = document.cookie
          .split('; ')
          .find((row) => row.startsWith('defrag_result='))
        if (stored) {
          sessionResult = JSON.parse(decodeURIComponent(stored.split('=')[1]))
          setResult(sessionResult)

          // Clear one-time cookie
          document.cookie = 'defrag_result=; path=/; max-age=0'
        }

        // Get current stats
        const userStats = await getUserStats(id)
        const sessionCount = await getUserSessionCount(id)
        if (userStats) {
          const fullStats: UserStats = {
            totalPoints: userStats.total_points ?? 0,
            currentStreak: sessionResult?.newStreak ?? userStats.current_streak ?? 0,
            longestStreak: userStats.longest_streak ?? 0,
            lastDefragDate: userStats.last_defrag_date,
            badges: userStats.badges ?? [],
            totalSessions: sessionCount,
            fatigueBreakdown: { LOGIC: 0, NARRATIVE: 0, VISUAL: 0, EMOTIONAL: 0 },
          }
          setStats(fullStats)

          // Show email capture if session 3+ and no email stored
          if (sessionCount >= 3 && !userStats.email && !localStorage.getItem('mental_defrag_email_dismissed')) {
            setShowEmail(true)
          }
        }
      } catch {}
    }
    init()
  }, [])

  const handleFeelingSubmit = (_feeling: FeelingAfter) => {
    setFeelingSubmitted(true)
  }

  const defaultStats: UserStats = {
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastDefragDate: null,
    badges: [],
    totalSessions: 0,
    fatigueBreakdown: { LOGIC: 0, NARRATIVE: 0, VISUAL: 0, EMOTIONAL: 0 },
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Completion Animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex flex-col items-center mb-8"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Brain className="h-16 w-16 text-[#4CAF7D]" />
        </motion.div>
        <h1 className="text-2xl font-bold text-white mt-4">Defrag Complete</h1>
        <p className="text-sm text-white/40 mt-1">
          Session {stats?.totalSessions ?? 1} today
        </p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <StreakDisplay stats={stats} newBadges={result?.newBadges ?? []} />
        </div>
      )}

      {/* Points earned */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-lg text-white font-semibold">
            +{result.pointsEarned} Brain Points
          </p>
        </motion.div>
      )}

      {/* Feeling Check */}
      {result && !feelingSubmitted && (
        <div className="mb-8">
          <FeelingCheck
            sessionId={result.sessionId}
            onSubmit={handleFeelingSubmit}
          />
        </div>
      )}

      {/* Email Capture */}
      {showEmail && userId && (
        <div className="mb-8">
          <EmailCapture
            userId={userId}
            onSuccess={() => setShowEmail(false)}
            onDismiss={() => setShowEmail(false)}
          />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-[#4CAF7D] text-white font-semibold py-3 px-8 text-sm hover:bg-[#4CAF7D]/90 transition-colors min-h-[44px]"
        >
          Start Another Defrag
        </button>
        <p className="text-xs text-white/30">Come back after your next heavy session</p>
      </div>
    </main>
  )
}