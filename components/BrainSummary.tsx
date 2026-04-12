'use client'

import { motion } from 'framer-motion'

type BrainSummaryItem = {
  type: string
  count: number
}

interface BrainSummaryProps {
  breakdown: BrainSummaryItem[]
  weekTotal: number
}

const TYPE_COLORS: Record<string, string> = {
  LOGIC: '#4CAF7D',
  NARRATIVE: '#3B6B9E',
  VISUAL: '#D4854A',
  EMOTIONAL: '#7B5EA7',
}

const TYPE_LABELS: Record<string, string> = {
  LOGIC: 'Logic Work',
  NARRATIVE: 'Reading/Writing',
  VISUAL: 'Visual Work',
  EMOTIONAL: 'Emotional Load',
}

export default function BrainSummary({ breakdown, weekTotal }: BrainSummaryProps) {
  if (!breakdown.length || weekTotal < 1) return null

  return (
    <section className="w-full max-w-md">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
        Your Brain This Week
      </h2>
      <div className="space-y-2">
        {breakdown.map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-2 text-sm text-white/75"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[item.type] ?? '#F5F5F5' }}
            />
            <span>{TYPE_LABELS[item.type] ?? item.type}</span>
            <span className="text-white/35">—</span>
            <span>{item.count}x</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
