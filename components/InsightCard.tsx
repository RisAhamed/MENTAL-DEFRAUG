'use client'

import { motion } from 'framer-motion'

interface InsightCardProps {
  insight: string | null
}

export default function InsightCard({ insight }: InsightCardProps) {
  if (!insight) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
      className="w-full max-w-md rounded-lg border border-[#D4A017]/40 bg-[#FFF8E7]/[0.05] p-5"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
        <span aria-hidden="true">✨</span>
        <span>Brain Pattern Insight</span>
      </div>
      <p className="text-base font-medium leading-7 text-white/85">{insight}</p>
    </motion.div>
  )
}
