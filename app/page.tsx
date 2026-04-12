'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Info, Loader2 } from 'lucide-react'
import { ShortcutChips } from '@/components/ShortcutChips'
import { getOrCreateAnonymousUser, getUserStats, getUserSessionCount } from '@/lib/user'
import { DefragProtocol, UserStats } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
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
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to analyze fatigue')
      }

      const protocol: DefragProtocol = await res.json()

      // Store in sessionStorage for subsequent pages
      sessionStorage.setItem('defrag_protocol', JSON.stringify(protocol))
      sessionStorage.setItem('defrag_input', input.trim())

      router.push('/result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between mb-16">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#4CAF7D]" />
          <span className="font-semibold text-white">Mental Defrag</span>
        </div>
        {stats && stats.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/50">
            🔥 <span>{stats.currentStreak} day streak</span>
          </div>
        )}
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center max-w-lg flex-1"
      >
        <h1 className="text-3xl font-bold text-white mb-3">
          What just fried your brain?
        </h1>
        <p className="text-sm text-white/50 mb-8">
          Tell us what you were doing. We&apos;ll tell you exactly how to recover.
        </p>

        {/* Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="e.g. I just spent 2 hours debugging a Python script and I can't think straight anymore"
          className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4CAF7D]/50 resize-none"
        />

        {/* Shortcut Chips */}
        <div className="mt-4 w-full">
          <ShortcutChips onSelect={(text) => setInput(text)} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || input.trim().length < 10}
          className="w-full mt-8 rounded-xl bg-[#4CAF7D] text-white font-semibold py-3.5 text-sm hover:bg-[#4CAF7D]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
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
        <div className="flex items-center gap-1.5 mt-12 text-xs text-white/30">
          <Info className="h-3 w-3" />
          Backed by cognitive load science
        </div>
      </motion.div>
    </main>
  )
}
