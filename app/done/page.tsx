'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { StreakDisplay } from '@/components/StreakDisplay'
import { FeelingCheck } from '@/components/FeelingCheck'
import { EmailCapture } from '@/components/EmailCapture'
import InsightCard from '@/components/InsightCard'
import BrainSummary from '@/components/BrainSummary'
import ShareCard from '@/components/ShareCard'
import { getOrCreateAnonymousUser, getUserStats, getUserSessionCount } from '@/lib/user'
import { BADGES } from '@/lib/badges'
import { UserStats } from '@/types'

interface SessionResult {
  sessionId: string | null
  pointsEarned: number
  newStreak: number
  longestStreak: number
  newBadges: string[]
  totalPoints: number
  totalSessions: number
  todaySessionCount?: number
  userEmail?: string | null
  saveFailed?: boolean
  fatigueType?: string
  firstName?: string
}

type BrainSummaryState = {
  breakdown: Array<{ type: string; count: number }>
  weekTotal: number
}

const BADGE_MAP = Object.fromEntries(Object.values(BADGES).map((badge) => [badge.id, badge]))

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
  const [showShareCard, setShowShareCard] = useState(false)

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
    if (!result || result.pointsEarned <= 0) return

    const duration = 800
    const steps = 20
    const increment = result.pointsEarned / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= result.pointsEarned) {
        setDisplayPoints(result.pointsEarned)
        clearInterval(timer)
      } else {
        setDisplayPoints(Math.floor(current))
      }
    }, interval)

    return () => clearInterval(timer)
  }, [result])

  useEffect(() => {
    function handleOpenEmailCapture() {
      setShowEmail(true)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }

    window.addEventListener('open-email-capture', handleOpenEmailCapture as EventListener)
    return () => {
      window.removeEventListener('open-email-capture', handleOpenEmailCapture as EventListener)
    }
  }, [])

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
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#0F0F0F] px-4 py-8 flex flex-col gap-6">
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
        {showStreakPopup && result && !result.saveFailed && (
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

      {/* Completion Animation with gradient card */}
      <motion.section
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-full max-w-2xl mx-auto flex flex-col items-center pb-6"
        style={{
          background: `linear-gradient(to bottom, rgba(76, 175, 125, 0.06), transparent)`,
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid rgba(76, 175, 125, 0.2)'
        }}
      >
        <div className="text-6xl">🧠</div>
        <h1 className="text-xl font-semibold text-[#F5F5F5] mt-4">Recovery Complete</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">
          Your brain gets {result?.pointsEarned ? Math.ceil(result.pointsEarned / 10) : 10} minutes back.
        </p>
      </motion.section>

      {/* Points earned with gold pill */}
      {result && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl mx-auto py-6 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.20)] px-4 py-2">
            <span>⚡</span>
            <span className="text-lg font-medium text-white">{displayPoints}</span>
            <span className="text-xs text-white/50">brain points earned</span>
          </div>
        </motion.section>
      )}

      {/* Stats */}
      {stats && !result?.saveFailed && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6">
          <StreakDisplay stats={stats} newBadges={result?.newBadges ?? []} />
        </section>
      )}

      {/* Streak Card */}
      {visibleStreak >= 1 && (
        <section className="w-full max-w-2xl mx-auto py-4">
          <div className="rounded-xl bg-[rgba(255,100,0,0.08)] border border-[rgba(255,100,0,0.20)] p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">🔥 {visibleStreak}</p>
              <p className="text-xs text-[#A0A0A0]">day streak</p>
            </div>
            {visibleStreak === 1 && (
              <p className="text-xs text-[#808080] max-w-[160px] text-right">
                Come back tomorrow to keep it going
              </p>
            )}
            {visibleStreak > 1 && (
              <p className="text-xs text-[#4CAF7D] max-w-[160px] text-right">
                You're on a roll. Don't break it.
              </p>
            )}
          </div>
        </section>
      )}

      {!!(result?.newBadges?.length && !result?.saveFailed) && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6">
          <p className="text-xs uppercase tracking-wider text-[#505050] mb-3">
            New Achievement{result.newBadges.length > 1 ? 's' : ''}
          </p>
          <div className="rounded-xl bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] p-4">
            <div className="flex gap-3 flex-wrap">
              {result.newBadges.map((badgeId, index) => {
                const badge = BADGE_MAP[badgeId]
                if (!badge) return null
                return (
                  <motion.div
                    key={badgeId}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white"
                  >
                    {badge.emoji} {badge.label}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {insight && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6 flex justify-center">
          <InsightCard insight={insight} />
        </section>
      )}

      {brainSummary && brainSummary.breakdown.length > 0 && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6 flex justify-center">
          <BrainSummary breakdown={brainSummary.breakdown} weekTotal={brainSummary.weekTotal} />
        </section>
      )}

      {/* Feeling Check */}
      {result && result.sessionId && !feelingSubmitted && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6">
          <h2 className="mb-3 text-center text-base font-medium text-white">How do you feel right now?</h2>
          <FeelingCheck
            sessionId={result.sessionId}
            onSubmit={handleFeelingSubmit}
          />
        </section>
      )}

      {/* Email Capture */}
      {showEmail && userId && (
        <section className="w-full max-w-2xl mx-auto border-b border-subtle py-6">
          <EmailCapture
            userId={userId}
            onSuccess={handleEmailSuccess}
            onDismiss={() => setShowEmail(false)}
          />
        </section>
      )}

      {/* Bottom Actions */}
      <section className="w-full max-w-2xl mx-auto py-6 flex flex-col items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="group w-full min-h-[52px] rounded-xl bg-[#4CAF7D] text-white font-semibold py-3 px-8 text-sm hover:bg-[#4CAF7D]/90 transition-colors"
        >
          Start Another Session →
        </button>
        <button
          onClick={() => setShowShareCard(true)}
          className="w-full min-h-[52px] rounded-xl border border-white/15 bg-transparent text-[#F5F5F5] font-medium py-3 px-8 text-sm"
        >
          Share Your Streak 🔗
        </button>
        <div className="flex flex-col items-center gap-1 mt-3">
          <p className="text-xs text-[#404040]">↑ Your streak updates in real time</p>
          <p className="text-xs text-[#404040]">
            {stats?.totalSessions ? '→ Progress saved to your account' : '→ Save your email to protect your streak'}
          </p>
        </div>
      </section>

      {/* Share Card Sheet */}
      <AnimatePresence>
        {showShareCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareCard(false)}
              className="fixed inset-0 z-40 bg-black/70"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#1A1A1A] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#F5F5F5]">Your Proof Card</h3>
                <button
                  onClick={() => setShowShareCard(false)}
                  className="text-2xl text-white/40"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-sm text-[#A0A0A0]">Screenshot this and share it</p>
              <div className="mt-6 flex justify-center">
                <div id="share-card-capture">
                  <ShareCard
                    firstName={savedName || result?.firstName || null}
                    currentStreak={visibleStreak}
                    totalPoints={stats?.totalPoints ?? 0}
                    badges={result?.newBadges ?? []}
                    dominantFatigueType={result?.fatigueType ?? null}
                  />
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-white/40">
                Screenshot the card above to share
              </p>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: 'Mental Defrag',
                      text: `I just defragged my brain 🧠 ${visibleStreak} day streak on Mental Defrag`,
                      url: window.location.origin,
                    })
                  }}
                  className="mt-4 w-full min-h-[52px] rounded-xl bg-[#4CAF7D] text-white font-semibold py-3 px-8 text-sm"
                >
                  Share →
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
