'use client'

import { UserStats } from '@/types'
import { BADGES } from '@/lib/badges'
import { motion } from 'framer-motion'

interface StreakDisplayProps {
  stats: UserStats
  newBadges: string[]
}

const BADGE_MAP = Object.fromEntries(
  Object.values(BADGES).map((b) => [b.id, b])
)

export function StreakDisplay({ stats, newBadges }: StreakDisplayProps) {
  const allBadges = [...new Set([...(stats.badges || []), ...newBadges])]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <motion.span
          animate={newBadges.length > 0 || stats.currentStreak > 0 ? { scale: [1, 1.18, 1] } : undefined}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
          className="text-3xl"
        >
          🔥
        </motion.span>
        <motion.span
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="text-2xl font-bold text-white"
        >
          {stats.currentStreak}
        </motion.span>
        <span className="text-sm text-white/60">day streak</span>
      </div>

      {/* Points */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <span className="text-lg font-semibold text-white">{stats.totalPoints}</span>
        <span className="text-sm text-white/60">Brain Points</span>
      </div>

      {/* Badges */}
      {allBadges.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {allBadges.map((badgeId, index) => {
            const badge = BADGE_MAP[badgeId]
            if (!badge) return null
            const isNew = newBadges.includes(badgeId)
            return (
              <motion.div
                key={badgeId}
                initial={isNew ? { scale: 0 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={isNew ? { type: 'spring', stiffness: 300, damping: 15, delay: index * 0.1 } : {}}
                className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5"
              >
                <span className="text-sm">{badge.emoji}</span>
                <span className="text-xs text-white/80">{badge.label}</span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Streak congrats */}
      {stats.currentStreak > 1 && (
        <p className="text-sm text-white/50 mt-1">
          {stats.currentStreak >= 7
            ? 'Incredible discipline! Your brain is building real recovery habits.'
            : stats.currentStreak >= 3
              ? 'Nice streak! Consistent recovery is building real cognitive resilience.'
              : 'Great start! Keep going to build your recovery streak.'}
        </p>
      )}
    </div>
  )
}
