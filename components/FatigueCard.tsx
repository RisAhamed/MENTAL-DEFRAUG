'use client'

import { DefragProtocol, FatigueType, Intensity } from '@/types'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { useState } from 'react'

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

export function FatigueCard({ protocol }: FatigueCardProps) {
  const router = useRouter()
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const bgColor = protocol.ambientColor + '1A' // ~10% opacity

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg rounded-2xl border border-white/10 p-6"
      style={{ backgroundColor: bgColor }}
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
      <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-200">{protocol.instagramWarning}</p>
      </div>

      <div className="border-t border-white/10 mb-6" />

      {/* Steps */}
      <div className="space-y-4">
        {protocol.steps.map((step, i) => (
          <div key={i}>
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => setExpandedStep(expandedStep === i ? null : i)}
            >
              <span className="mt-0.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono text-white/70 whitespace-nowrap">
                {step.duration}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90">{step.action}</p>
                <p className="text-xs text-white/50 mt-1">{step.why}</p>
              </div>
              {expandedStep === i ? (
                <ChevronUp className="h-4 w-4 text-white/40 flex-shrink-0 mt-1" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/40 flex-shrink-0 mt-1" />
              )}
            </div>
            {expandedStep === i && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="ml-[72px] mt-2 rounded-lg bg-red-500/10 border border-red-500/15 p-3"
              >
                <p className="text-xs text-red-300">
                  <span className="font-medium">Avoid:</span> {step.avoid}
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 my-6" />

      {/* Start Button */}
      <button
        onClick={() => router.push('/timer')}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold py-3.5 text-sm hover:bg-white/90 transition-colors"
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