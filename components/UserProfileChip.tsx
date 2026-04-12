'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface UserProfileChipProps {
  userId: string
}

type HeaderStats = {
  currentStreak: number
  email: string | null
  firstName?: string | null
}

export default function UserProfileChip({ userId }: UserProfileChipProps) {
  const [stats, setStats] = useState<HeaderStats | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const response = await fetch(`/api/user-stats?userId=${encodeURIComponent(userId)}`)
        const data = await response.json()

        if (!response.ok || cancelled) return

        setStats({
          currentStreak: data.stats?.currentStreak ?? data.stats?.current_streak ?? 0,
          email: data.stats?.email ?? null,
          firstName: data.stats?.firstName ?? data.stats?.first_name ?? null,
        })
      } catch {}
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [userId])

  if (!stats) return null
  if (stats.currentStreak === 0 && !stats.email) return null

  const profileLabel = stats.email ? `👤${stats.firstName ? ` ${stats.firstName}` : ''}` : ''
  const streakLabel = stats.currentStreak >= 1 ? `🔥 ${stats.currentStreak} day streak` : ''
  const label = [profileLabel, streakLabel].filter(Boolean).join(' ')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-sm text-white"
    >
      {label}
    </motion.div>
  )
}
