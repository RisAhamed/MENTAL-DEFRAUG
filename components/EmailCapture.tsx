'use client'

import { useState } from 'react'

interface EmailCaptureProps {
  userId: string
  onSuccess: () => void
  onDismiss: () => void
}

const DISMISS_KEY = 'mental_defrag_email_dismissed'

export function EmailCapture({ userId, onSuccess, onDismiss }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), userId }),
      })

      if (!res.ok) throw new Error('Failed to send')

      setSent(true)
      onSuccess()
    } catch {
      setError('Failed to send magic link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    onDismiss()
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-white/10 p-5 text-center max-w-md mx-auto">
        <p className="text-sm text-white/80">Check your email for a magic link ✉️</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 p-5 max-w-md mx-auto">
      <h3 className="text-base font-semibold text-white mb-1">Save your streak across all devices</h3>
      <p className="text-xs text-white/50 mb-4">We&apos;ll also send you a weekly brain performance summary</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <button
        onClick={handleDismiss}
        className="text-xs text-white/30 hover:text-white/50 mt-3 block mx-auto transition-colors"
      >
        Not now
      </button>
    </div>
  )
}