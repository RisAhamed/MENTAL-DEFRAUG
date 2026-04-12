'use client'

interface ShortcutChipsProps {
  onSelect: (text: string) => void
}

const CHIPS = [
  { emoji: '💻', text: 'I just spent time coding and debugging' },
  { emoji: '📖', text: 'I just finished reading and studying from a textbook' },
  { emoji: '✍️', text: 'I just spent time writing an essay or taking notes' },
  { emoji: '🎨', text: 'I just worked on design and visual creative work' },
]

export function ShortcutChips({ onSelect }: ShortcutChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CHIPS.map((chip) => (
        <button
          key={chip.emoji}
          onClick={() => onSelect(chip.text)}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          {chip.emoji} {chip.text}
        </button>
      ))}
    </div>
  )
}