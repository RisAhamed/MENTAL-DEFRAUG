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

export function FatigueCard({ protocol }: FatigueCardProps) {
  const router = useRouter()
  const duration = protocol.totalDuration || 10

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden w-full max-w-2xl mx-auto rounded-2xl p-5 md:p-6"
      style={{
        backgroundColor: '#161616',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div 
        className="absolute left-0 top-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: protocol.ambientColor }}
      />

      {/* Fatigue Type Badge */}
      <div 
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider mb-3"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: protocol.ambientColor
        }}
      >
        {FATIGUE_EMOJIS[protocol.fatigueType]} {FATIGUE_LABELS[protocol.fatigueType]} fatigue · {protocol.intensity}
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-bold mb-4 text-[#F5F5F5]">
        {protocol.headline}
      </h1>

      {/* Context Message as Blockquote */}
      <blockquote 
        className="border-l-2 pl-4 my-4 italic text-[#909090] text-sm"
        style={{ borderColor: protocol.ambientColor }}
      >
        {protocol.contextMessage}
      </blockquote>

      <div className="border-t border-[rgba(255,255,255,0.07)] mb-6" />

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
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)' 
                }}
              />
            )}
            
            {/* Step number circle */}
            <div className="absolute left-0">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F5F5F5'
                }}
              >
                {i + 1}
              </div>
            </div>

            {/* Step content */}
            <div className="pl-12">
              <p className="text-xs uppercase tracking-wider mb-2 text-[#606060]">
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

      <div className="border-t border-[rgba(255,255,255,0.07)] my-6" />

      {/* Start Button */}
      <button
        onClick={() => router.push('/timer')}
        className="group w-full min-h-[52px] mt-6 flex items-center justify-center gap-2 rounded-xl font-semibold py-3.5 text-sm tracking-wide transition-all relative overflow-hidden hover:bg-[rgba(255,255,255,0.12)]"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#F5F5F5'
        }}
      >
        <span 
          className="absolute left-0 top-0 w-1 h-full rounded-l-xl"
          style={{ backgroundColor: protocol.ambientColor }} 
        />
        <span className="transition-transform group-hover:translate-x-1">▶</span>
        Start {duration}-Min Recovery
      </button>

      <p className="text-xs text-[#505050] text-center mt-2">
        Keep this screen open. Timer starts immediately.
      </p>
    </motion.div>
  )
}
