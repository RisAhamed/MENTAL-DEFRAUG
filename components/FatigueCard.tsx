'use client'

import { DefragProtocol, FatigueType, Intensity } from '@/types'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const INTENSITY_COLORS: Record<Intensity, string> = {
  LIGHT: 'bg-green-500/20 text-green-300 border-green-500/30',
  MODERATE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  HEAVY: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const FATIGUE_LABELS: Record<FatigueType, string> = {
  LOGIC: 'Logic',
  NARRATIVE: 'Narrative',
  VISUAL: 'Visual',
  EMOTIONAL: 'Emotional',
}

const FATIGUE_EMOJIS: Record<FatigueType, string> = {
  LOGIC: '💻',
  NARRATIVE: '📖',
  VISUAL: '🎨',
  EMOTIONAL: '😓',
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
  const duration = protocol.totalDuration || 10

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
      {/* Fatigue Type Badge */}
      <div 
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider mb-3"
        style={{ 
          backgroundColor: hexToRgba(protocol.ambientColor, 0.15),
          color: protocol.ambientColor,
          border: `1px solid ${hexToRgba(protocol.ambientColor, 0.30)}`
        }}
      >
        {FATIGUE_EMOJIS[protocol.fatigueType]} {FATIGUE_LABELS[protocol.fatigueType]} fatigue · {protocol.intensity}
      </div>

      {/* Headline */}
      <h1 
        className="text-2xl font-bold mb-4"
        style={{ color: protocol.ambientColor }}
      >
        {protocol.headline}
      </h1>

      {/* Context Message as Blockquote */}
      <blockquote 
        className="border-l-2 pl-4 my-4 italic text-[#C0C0C0] text-sm"
        style={{ borderColor: protocol.ambientColor }}
      >
        {protocol.contextMessage}
      </blockquote>

      <div className="border-t border-white/10 mb-6" />

      {/* Steps with connector lines */}
      <div>
        {protocol.steps.map((step, i) => (
          <div 
            key={i} 
            className="relative pb-8 last:pb-0 card-hover"
          >
            {/* Connector line */}
            {i !== protocol.steps.length - 1 && (
              <div 
                className="absolute left-2 top-8 bottom-0 w-px"
                style={{ 
                  background: `linear-gradient(to bottom, ${hexToRgba(protocol.ambientColor, 0.3)}, transparent)` 
                }}
              />
            )}
            
            {/* Step number circle */}
            <div className="absolute left-0">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ 
                  backgroundColor: hexToRgba(protocol.ambientColor, 0.2),
                  color: protocol.ambientColor,
                  border: `1px solid ${hexToRgba(protocol.ambientColor, 0.4)}`
                }}
              >
                {i + 1}
              </div>
            </div>

            {/* Step content */}
            <div className="pl-12">
              <p 
                className="text-xs uppercase tracking-wider mb-2"
                style={{ color: protocol.ambientColor }}
              >
                {step.duration}
              </p>
              <p className="text-base text-[#F0F0F0] font-medium leading-relaxed">
                {step.action}
              </p>
              
              {/* WHY section */}
              <div className="mt-3 flex gap-2">
                <span 
                  className="text-[10px] uppercase tracking-wider text-[#505050] pt-0.5 shrink-0"
                >
                  Why
                </span>
                <p className="text-xs text-[#808080] leading-relaxed">{step.why}</p>
              </div>
              
              {/* AVOID section (collapsible) */}
              <details className="mt-2">
                <summary 
                  className="text-[10px] uppercase tracking-wider text-[#505050] cursor-pointer list-none flex items-center gap-1"
                >
                  <span>▸</span> Avoid
                </summary>
                <p className="text-xs text-[#707070] mt-1 pl-3 leading-relaxed">
                  {step.avoid}
                </p>
              </details>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 my-6" />

      {/* Start Button */}
      <button
        onClick={() => router.push('/timer')}
        className="group w-full min-h-[52px] mt-6 flex items-center justify-center gap-2 rounded-xl text-white font-semibold py-3.5 text-sm tracking-wide transition-colors"
        style={{ backgroundColor: protocol.ambientColor }}
      >
        <span className="transition-transform group-hover:translate-x-1">▶</span>
        Start {duration}-Min Recovery
      </button>

      <p className="text-xs text-[#505050] text-center mt-2">
        Keep this screen open. Timer starts immediately.
      </p>
    </motion.div>
  )
}