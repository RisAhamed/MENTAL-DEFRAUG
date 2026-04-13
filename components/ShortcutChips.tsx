'use client'

interface ShortcutChipsProps {
  onSelect: (text: string) => void
}

const CHIPS = [
  { emoji: '💻', text: 'I just spent time coding and debugging' },
  { emoji: '📖', text: 'I just finished reading and studying from a textbook' },
  { emoji: '🎨', text: 'I just worked on design and visual creative work' },
  { emoji: '✍️', text: 'I just spent time writing an essay or taking notes' },
]

export function ShortcutChips({ onSelect }: ShortcutChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip.emoji}
          onClick={() => onSelect(chip.text)}
          className="min-h-[40px] rounded-full border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-2 text-sm text-[#808080] hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#C0C0C0] transition-colors"
        >
          <span className="mr-1">{chip.emoji}</span>
          {chip.text}
        </button>
      ))}
    </div>
  )
}