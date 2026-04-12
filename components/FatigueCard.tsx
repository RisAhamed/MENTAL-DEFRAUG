'use client'

import { DefragProtocol, FatigueType, Intensity } from '@/types'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

const INTENSITY_COLORS: Record<Intensity, string> = {
  LIGHT: 'bg-green-500/20 text-green-300 border-green-500/30',
  MODERATE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  HEAVY: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const FATIGUE_LABELS: Record<FatigueType, string> = {
  LOGIC: 'Logic Fatigue',
  NARRATIVE: 'Narrative Fatigue',
  VISUAL: 'Visual Fatigue',
  EMOTIONAL: 'Emotional Fatigue',
}

interface FatigueCardProps {
  protocol: DefragProtocol
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function FatigueCard({ protocol }: FatigueCardProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto rounded-2xl p-5 md:p-6"
      style={{
        backgroundColor: hexToRgba(protocol.ambientColor, 0.08),
        border: `1px solid ${hexToRgba(protocol.ambientColor, 0.25)}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/90">
          {FATIGUE_LABELS[protocol.fatigueType]}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${INTENSITY_COLORS[protocol.intensity]}`}>
          {protocol.intensity}
        </span>
      </div>

      {/* Instagram Warning */}
      <div className="rounded-xl bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.30)] p-4 mb-5">
        <p className="text-sm text-[#F5F5F5]">⚠️ {protocol.instagramWarning}</p>
      </div>

      <div className="border-t border-white/10 mb-6" />

      {/* Steps */}
      <div>
        {protocol.steps.map((step, i) => (
          <div key={i} className={`relative flex gap-4 py-4 ${i !== protocol.steps.length - 1 ? 'border-b border-subtle' : ''}`}>
            <div>
              <span
                className="mt-0.5 inline-block rounded-full px-2 py-1 text-xs font-mono text-white/80 whitespace-nowrap"
                style={{ backgroundColor: hexToRgba(protocol.ambientColor, 0.2) }}
              >
                {step.duration}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">{step.action}</p>
              <p className="mt-1 text-sm text-[#A0A0A0]">{step.why}</p>
              <details className="mt-2 rounded-lg bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.30)] p-3">
                <summary className="cursor-pointer text-xs font-medium text-[#FCA5A5]">What to avoid</summary>
                <p className="mt-2 text-xs text-[#FCA5A5]">{step.avoid}</p>
              </details>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 my-6" />

      {/* Start Button */}
      <button
        onClick={() => router.push('/timer')}
        className="w-full min-h-[52px] mt-6 flex items-center justify-center gap-2 rounded-xl text-white font-semibold py-3.5 text-sm transition-colors"
        style={{ backgroundColor: protocol.ambientColor }}
      >
        <Play className="h-4 w-4" />
        START MY 10-MIN DEFRAG
      </button>

      <p className="text-center text-xs text-white/40 mt-3">
        This protocol is designed specifically for {protocol.fatigueType.toLowerCase()} fatigue
      </p>
    </motion.div>
  )
}
