'use client'

import { FeelingAfter } from '@/types'
import { useState } from 'react'

const OPTIONS: { emoji: string; label: string; value: FeelingAfter }[] = [
  { emoji: '😵', label: 'Still fried', value: 'still_fried' },
  { emoji: '😐', label: 'A bit better', value: 'bit_better' },
  { emoji: '😊', label: 'Much clearer', value: 'much_clearer' },
]

interface FeelingCheckProps {
  sessionId: string
  onSubmit: (feeling: FeelingAfter) => void
}

export function FeelingCheck({ sessionId, onSubmit }: FeelingCheckProps) {
  const [selected, setSelected] = useState<FeelingAfter | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(feeling: FeelingAfter) {
    setLoading(true)
    setSelected(feeling)

    try {
      await fetch('/api/save-feeling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, feelingAfter: feeling }),
      })
    } catch {}

    onSubmit(feeling)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-white/60">How do you feel right now?</p>
      <div className="flex gap-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !selected && handleSubmit(opt.value)}
            disabled={!!selected || loading}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all min-w-[80px] ${
              selected === opt.value
                ? 'border-white/40 bg-white/15 scale-105'
                : selected
                  ? 'border-white/5 bg-white/5 opacity-40'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-xs text-white/70">{opt.label}</span>
            {selected === opt.value && (
              <span className="text-xs text-white/50">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}