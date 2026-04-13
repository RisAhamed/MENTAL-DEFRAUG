'use client'

import { motion } from 'framer-motion'

interface ShareCardProps {
  firstName: string | null
  currentStreak: number
  totalPoints: number
  badges: string[]
  dominantFatigueType: string | null
}

const BADGE_EMOJIS: Record<string, string> = {
  first_defrag: '🧠',
  three_day_streak: '🔥',
  seven_day_streak: '⚡',
  fourteen_day_streak: '💎',
  ten_sessions: '🏆',
}

const FATIGUE_LABELS: Record<string, { emoji: string; label: string }> = {
  LOGIC: { emoji: '💻', label: 'Logic specialist' },
  NARRATIVE: { emoji: '📖', label: 'Narrative specialist' },
  VISUAL: { emoji: '🎨', label: 'Visual specialist' },
  EMOTIONAL: { emoji: '😓', label: 'Emotional specialist' },
}

const FATIGUE_COLORS: Record<string, string> = {
  LOGIC: '#4CAF7D',
  NARRATIVE: '#3B6B9E',
  VISUAL: '#D4854A',
  EMOTIONAL: '#7B5EA7',
}

export default function ShareCard({
  firstName,
  currentStreak,
  totalPoints,
  badges,
  dominantFatigueType,
}: ShareCardProps) {
  const fatigueInfo = dominantFatigueType ? FATIGUE_LABELS[dominantFatigueType] : null
  const fatigueColor = dominantFatigueType
    ? FATIGUE_COLORS[dominantFatigueType]
    : null

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative flex w-[360px] flex-col rounded-2xl border border-white/12 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A] p-8"
      style={{ height: '480px' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          Mental Defrag
        </span>
        <span className="text-xl">🧠</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Streak display */}
      <div className="flex flex-col items-center">
        <span className="text-5xl">🔥</span>
        <span className="mt-2 text-7xl font-bold text-[#F5F5F5]">{currentStreak}</span>
        <span className="mt-1 text-base text-white/50">day streak</span>
      </div>

      {/* Points */}
      <div className="mt-4 flex justify-center">
        <span className="text-lg text-[#4CAF7D]">⚡ {totalPoints} brain points</span>
      </div>

      {/* Fatigue type chip */}
      {fatigueInfo && fatigueColor && (
        <div
          className="mx-auto mt-4 rounded-full border px-4 py-2 text-sm"
          style={{
            backgroundColor: `${fatigueColor}33`,
            borderColor: `${fatigueColor}66`,
            color: fatigueColor,
          }}
        >
          {fatigueInfo.emoji} {fatigueInfo.label}
        </div>
      )}

      {/* Badge row */}
      {badges.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          {badges.slice(0, 4).map((badgeId) => (
            <span key={badgeId} className="text-2xl">
              {BADGE_EMOJIS[badgeId] || '🏅'}
            </span>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="border-t border-white/08" />

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-white/50">
          {firstName ? `— ${firstName}` : ''}
        </span>
        <span className="text-xs text-white/25">mental-defrag.vercel.app</span>
      </div>
    </motion.div>
  )
}