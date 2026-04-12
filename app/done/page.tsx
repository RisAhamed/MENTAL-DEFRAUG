'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { StreakDisplay } from '@/components/StreakDisplay'
import { FeelingCheck } from '@/components/FeelingCheck'
import { EmailCapture } from '@/components/EmailCapture'
import InsightCard from '@/components/InsightCard'
import BrainSummary from '@/components/BrainSummary'
import { getOrCreateAnonymousUser, getUserStats, getUserSessionCount } from '@/lib/user'
import { UserStats } from '@/types'

interface SessionResult {
  sessionId: string
  pointsEarned: number
  newStreak: number
  longestStreak: number
  newBadges: string[]
  totalPoints: number
  totalSessions: number
  todaySessionCount?: number
  userEmail?: string | null
}

type BrainSummaryState = {
  breakdown: Array<{ type: string; count: number }>
  weekTotal: number
}

function DonePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [result, setResult] = useState<SessionResult | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [feelingSubmitted, setFeelingSubmitted] = useState(false)
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLinkedBanner, setShowLinkedBanner] = useState(false)
  const [displayPoints, setDisplayPoints] = useState(0)
  const [insight, setInsight] = useState<string | null>(null)
  const [brainSummary, setBrainSummary] = useState<BrainSummaryState | null>(null)
  const [firstName, setFirstName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [savedName, setSavedName] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
        setUserId(id)

        // Read session result from cookie, with a sessionStorage fallback for older in-flight sessions.
        const cookieResult = document.cookie
          .split('; ')
          .find((row) => row.startsWith('session_result='))
        const storedResult = cookieResult
          ? decodeURIComponent(cookieResult.split('=')[1])
          : sessionStorage.getItem('defrag_result')

        let sessionResult: SessionResult | null = null
        if (storedResult) {
          sessionResult = JSON.parse(storedResult)
          setResult(sessionResult)
          document.cookie = 'session_result=; path=/; max-age=0; samesite=lax'
          sessionStorage.removeItem('defrag_result')
          sessionStorage.removeItem('defrag_protocol')
          sessionStorage.removeItem('defrag_input')
        }

        if (sessionResult) {
          void fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, totalSessions: sessionResult.totalSessions }),
          })
            .then((response) => response.json())
            .then((data) => setInsight(data.insight ?? null))
            .catch(() => setInsight(null))
        }

        void fetch(`/api/brain-summary?userId=${encodeURIComponent(id)}`)
          .then((response) => response.json())
          .then((data) => {
            setBrainSummary({
              breakdown: data.breakdown ?? [],
              weekTotal: data.weekTotal ?? 0,
            })
          })
          .catch(() => setBrainSummary(null))

        // Get current stats
        const userStats = await getUserStats(id)
        const sessionCount = await getUserSessionCount(id)
        if (userStats) {
          const fullStats: UserStats = {
            totalPoints: sessionResult?.totalPoints ?? userStats.total_points ?? 0,
            currentStreak: sessionResult?.newStreak ?? userStats.current_streak ?? 0,
            longestStreak: sessionResult?.longestStreak ?? userStats.longest_streak ?? 0,
            lastDefragDate: userStats.last_defrag_date,
            badges: userStats.badges ?? [],
            totalSessions: sessionResult?.totalSessions ?? sessionCount,
            fatigueBreakdown: { LOGIC: 0, NARRATIVE: 0, VISUAL: 0, EMOTIONAL: 0 },
          }
          setStats(fullStats)

          // Show email capture if session 3+ and no email stored
          if (
            (sessionResult?.totalSessions ?? sessionCount) >= 3 &&
            !sessionResult?.userEmail &&
            !userStats.email &&
            !localStorage.getItem('email_capture_dismissed')
          ) {
            setShowEmail(true)
          }
        }
      } catch {}
    }
    init()
  }, [])

  const handleFeelingSubmit = () => {
    setFeelingSubmitted(true)
  }

  const handleEmailSuccess = () => {
    setShowEmail(true)
  }

  const visibleStreak = Math.max(result?.newStreak ?? stats?.currentStreak ?? 1, 1)
  const todaySessionDisplay = result?.todaySessionCount ?? result?.totalSessions ?? stats?.totalSessions ?? 1

  useEffect(() => {
    if (!result) return

    const showDelay = setTimeout(() => setShowStreakPopup(true), 700)
    const hideDelay = setTimeout(() => setShowStreakPopup(false), 7600)

    return () => {
      clearTimeout(showDelay)
      clearTimeout(hideDelay)
    }
  }, [result])

  useEffect(() => {
    if (!result) return

    const controls = animate(0, result.pointsEarned, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayPoints(Math.round(latest)),
    })

    return () => controls.stop()
  }, [result])

  useEffect(() => {
    if (searchParams.get('linked') !== 'true') return

    setShowLinkedBanner(true)
    setShowNamePrompt(true)
    const hideDelay = setTimeout(() => setShowLinkedBanner(false), 4000)
    return () => clearTimeout(hideDelay)
  }, [searchParams])

  async function handleSaveFirstName() {
    const trimmedName = firstName.trim()
    if (!userId || !trimmedName) {
      setShowNamePrompt(false)
      return
    }

    try {
      const response = await fetch('/api/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, firstName: trimmedName }),
      })

      if (!response.ok) throw new Error('Failed to save first name')

      setSavedName(trimmedName)
      setShowNamePrompt(false)
    } catch {
      setShowNamePrompt(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <AnimatePresence>
        {showLinkedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-5 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-lg border border-[#4CAF7D]/40 bg-[#101510]/95 px-4 py-3 text-center text-sm font-medium text-white shadow-2xl shadow-black/40"
          >
            ✅ Your streak is now saved across all your devices
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed left-1/2 top-20 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-lg border border-white/15 bg-[#101510]/95 p-3 shadow-2xl shadow-black/40"
          >
            <div className="flex gap-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="What should we call you? (optional)"
                className="min-h-[44px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
              />
              <button
                onClick={handleSaveFirstName}
                className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Save
              </button>
            </div>
            <button
              onClick={() => setShowNamePrompt(false)}
              className="mt-2 text-xs text-white/35 transition-colors hover:text-white/60"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {savedName && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-1/2 top-20 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-lg border border-[#4CAF7D]/30 bg-[#101510]/95 px-4 py-3 text-center text-sm text-white"
        >
          Hey {savedName}, your brain is in good hands 🧠
        </motion.p>
      )}

      <AnimatePresence>
        {showStreakPopup && result && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed left-1/2 top-5 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-lg border border-[#4CAF7D]/40 bg-[#101510]/95 p-4 text-center shadow-2xl shadow-black/40 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: [0.8, 1.12, 1], rotate: [-5, 4, 0] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#4CAF7D] text-2xl"
            >
              🔥
            </motion.div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4CAF7D]">
              Journey continued
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              Day {visibleStreak} streak unlocked
            </h2>
            <p className="mt-1 text-sm leading-5 text-white/65">
              One more recovery rep logged. Keep building the kind of brain that comes back clear.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
          Session {todaySessionDisplay} today
        </p>
      </motion.div>

      {/* Points earned */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-lg text-white font-semibold">
            +{displayPoints} Brain Points
          </p>
        </motion.div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <StreakDisplay stats={stats} newBadges={result?.newBadges ?? []} />
        </div>
      )}

      {insight && (
        <div className="mb-8 flex w-full justify-center">
          <InsightCard insight={insight} />
        </div>
      )}

      {brainSummary && brainSummary.breakdown.length > 0 && (
        <div className="mb-8 flex w-full justify-center">
          <BrainSummary breakdown={brainSummary.breakdown} weekTotal={brainSummary.weekTotal} />
        </div>
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
            onSuccess={handleEmailSuccess}
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

export default function DonePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-sm text-white/50">Loading completion...</p>
        </main>
      }
    >
      <DonePageContent />
    </Suspense>
  )
}
