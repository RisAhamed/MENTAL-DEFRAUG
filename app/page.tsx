'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Info, Loader2 } from 'lucide-react'
import { ShortcutChips } from '@/components/ShortcutChips'
import UserProfileChip from '@/components/UserProfileChip'
import { getOrCreateAnonymousUser, getUserStats, getUserSessionCount } from '@/lib/user'
import { DefragProtocol, UserStats } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('mental_defrag_user_id')
      setUserId(id)
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
        setUserId(id)
        const userStats = await getUserStats(id)
        const sessionCount = await getUserSessionCount(id)
        if (userStats) {
          setStats({
            totalPoints: userStats.total_points ?? 0,
            currentStreak: userStats.current_streak ?? 0,
            longestStreak: userStats.longest_streak ?? 0,
            lastDefragDate: userStats.last_defrag_date,
            badges: userStats.badges ?? [],
            totalSessions: sessionCount,
            fatigueBreakdown: { LOGIC: 0, NARRATIVE: 0, VISUAL: 0, EMOTIONAL: 0 },
          })
        }
      } catch {}
    }
    init()
  }, [])

  function getErrorMessage(status?: number) {
    if (status === 429) return "You're going too fast! Wait 30 seconds and try again."
    if (status === 504) return 'The analysis timed out. Check your connection and try again.'
    return 'Something went wrong. Please try again.'
  }

  async function handleSubmit() {
    if (!input.trim() || input.trim().length < 10) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/defrag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })

      if (!res.ok) {
        throw new Error(getErrorMessage(res.status))
      }

      const protocol: DefragProtocol = await res.json()

      // Store in sessionStorage for subsequent pages
      sessionStorage.setItem('defrag_protocol', JSON.stringify(protocol))
      sessionStorage.setItem('defrag_input', input.trim())

      router.push('/result')
    } catch (err) {
      setError(err instanceof Error ? err.message : getErrorMessage())
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#0F0F0F] px-4 md:px-6 flex flex-col">
      {/* Header */}
      <header className="w-full py-4 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#4CAF7D]" />
          <span className="font-semibold text-white">Mental Defrag</span>
        </div>
        {userId ? (
          <UserProfileChip userId={userId} />
        ) : stats && stats.currentStreak > 0 ? (
          <div className="flex items-center gap-1 text-xs text-white/50">
            🔥 <span>{stats.currentStreak} day streak</span>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <div className="flex-1 w-full max-w-2xl mx-auto py-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-3">
            What just fried your brain?
          </h1>
          <p className="text-base md:text-lg text-[#A0A0A0] mt-2 mb-8">
            Tell us what you were doing. We&apos;ll tell you exactly how to recover.
          </p>
        </motion.div>

        {/* Input */}
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (error) setError('')
          }}
          rows={4}
          placeholder="e.g. I just spent 2 hours debugging a Python script and I can't think straight anymore"
          className="w-full min-h-[120px] rounded-xl border border-[rgba(255,255,255,0.10)] bg-[#1A1A1A] p-4 text-base text-[#F5F5F5] placeholder:text-[#606060] focus:outline-none focus:border-[#4CAF7D] focus:ring-1 focus:ring-[#4CAF7D] resize-none"
        />

        {/* Shortcut Chips */}
        <div className="w-full flex flex-wrap gap-2 mt-3">
          <ShortcutChips
            onSelect={(text) => {
              setInput(text)
              if (error) setError('')
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-[rgba(220,38,38,0.30)] bg-[rgba(220,38,38,0.12)] p-4">
            <p className="text-sm text-[#F5F5F5]">{error}</p>
            <p className="mt-1 text-xs text-[#FCA5A5]">Couldn&apos;t analyse your session. Your internet might be slow.</p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-3 min-h-[44px] rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-40"
            >
              Try again
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || input.trim().length < 10}
          className="w-full mt-4 min-h-[52px] rounded-xl bg-[#4CAF7D] text-white font-semibold text-base hover:bg-[#4CAF7D]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing your fatigue...
            </>
          ) : (
            <>
              DEFRAG MY BRAIN →
            </>
          )}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-12 text-xs text-white/30">
          <Info className="h-3 w-3" />
          Backed by cognitive load science
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="rounded-2xl border border-white/10 bg-[#1A1A1A] px-6 py-7 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto mb-3 text-3xl"
              >
                🧠
              </motion.div>
              <p className="text-sm font-medium text-white">Reading your cognitive state...</p>
              <p className="mt-1 text-xs text-white/60">This takes 2–3 seconds</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
