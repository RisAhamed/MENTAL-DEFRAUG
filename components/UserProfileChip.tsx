'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BADGES } from '@/lib/badges'

interface UserProfileChipProps {
  userId: string
}

type HeaderStats = {
  currentStreak: number
  totalPoints: number
  email: string | null
  badges: string[]
  firstName?: string | null
  totalSessions: number
}

const BADGE_MAP = Object.fromEntries(Object.values(BADGES).map((badge) => [badge.id, badge]))

export default function UserProfileChip({ userId }: UserProfileChipProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<HeaderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        setLoading(true)
        const response = await fetch(`/api/user-stats?userId=${encodeURIComponent(userId)}`)
        const data = await response.json()

        if (!response.ok || cancelled) return

        setStats({
          currentStreak: data.stats?.currentStreak ?? data.stats?.current_streak ?? 0,
          totalPoints: data.stats?.totalPoints ?? data.stats?.total_points ?? 0,
          email: data.stats?.email ?? null,
          badges: data.stats?.badges ?? [],
          firstName: data.stats?.firstName ?? data.stats?.first_name ?? null,
          totalSessions: data.stats?.totalSessions ?? data.stats?.total_sessions ?? data.sessionCount ?? 0,
        })
      } catch {
        if (!cancelled) {
          setStats({
            currentStreak: 0,
            totalPoints: 0,
            email: null,
            badges: [],
            firstName: null,
            totalSessions: 0,
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (!isOpen) return

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const firstName = stats?.firstName?.trim()
  const hasName = Boolean(firstName)
  const nameLabel = hasName ? `👤 ${firstName}` : '👤'
  const streak = stats?.currentStreak ?? 0
  const totalPoints = stats?.totalPoints ?? 0
  const badges = stats?.badges ?? []
  const email = stats?.email ?? null
  const totalSessions = stats?.totalSessions ?? 0

  const avatarLetter = hasName ? firstName?.charAt(0).toUpperCase() : '?'

  function handleSaveStreakClick() {
    window.dispatchEvent(new CustomEvent('open-email-capture'))
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.12)]"
      >
        <span>{nameLabel}</span>
        {!loading && streak >= 1 && <span className="ml-2">🔥 {streak}</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[240px] rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#1A1A1A] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4CAF7D] text-base font-semibold text-white">
                {avatarLetter}
              </div>
              <div>
                <p className="font-medium text-white">{hasName ? firstName : 'Anonymous User'}</p>
                <p className="text-sm text-[#A0A0A0]">{email ?? 'No email saved yet'}</p>
              </div>
            </div>

            <div className="my-3 border-t border-[rgba(255,255,255,0.08)]" />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-lg text-white">🔥 {streak}</p>
                <p className="text-[11px] text-[#A0A0A0]">day streak</p>
              </div>
              <div>
                <p className="text-lg text-white">⚡ {totalPoints}</p>
                <p className="text-[11px] text-[#A0A0A0]">brain points</p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                {badges.slice(0, 3).map((badgeId) => {
                  const badge = BADGE_MAP[badgeId]
                  if (!badge) return null
                  return (
                    <span
                      key={badge.id}
                      title={badge.label}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] text-sm"
                    >
                      {badge.emoji}
                    </span>
                  )
                })}
              </div>
            )}

            {totalSessions > 0 && (
              <button
                type="button"
                aria-label="View dashboard"
                onClick={() => {
                  router.push('/dashboard')
                  setIsOpen(false)
                }}
                className="mt-3 text-xs text-white/80 hover:text-white"
              >
                📊 View Dashboard →
              </button>
            )}

            <div className="my-3 border-t border-[rgba(255,255,255,0.08)]" />

            {!email ? (
              <button
                type="button"
                onClick={handleSaveStreakClick}
                className="text-xs text-[#4CAF7D] hover:text-[#6cc995]"
              >
                💾 Save your streak →
              </button>
            ) : (
              <p className="text-xs text-[#7FB48F]">✅ Streak saved across devices</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
