'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DefragProtocol } from '@/types'
import { AmbientTimer } from '@/components/AmbientTimer'
import { getOrCreateAnonymousUser } from '@/lib/user'

export default function TimerPage() {
  const router = useRouter()
  const [protocol, setProtocol] = useState<DefragProtocol | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const id = await getOrCreateAnonymousUser()
        setUserId(id)
      } catch {}

      try {
        const stored = document.cookie
          .split('; ')
          .find((row) => row.startsWith('defrag_protocol='))
        if (stored) {
          const parsed = JSON.parse(decodeURIComponent(stored.split('=')[1]))
          setProtocol(parsed)
        } else {
          router.push('/')
        }
      } catch {
        router.push('/')
      }
    }
    init()
  }, [router])

  const saveSession = useCallback(async (timerCompleted: boolean) => {
    if (!userId || !protocol) return

    try {
      const res = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inputText: '', // Will be populated from the input page flow
          fatigueType: protocol.fatigueType,
          intensity: protocol.intensity,
          protocol,
          timerCompleted,
        }),
      })

      const data = await res.json()

      // Store session result in cookie for done page
      document.cookie = `defrag_result=${encodeURIComponent(JSON.stringify({
        sessionId: data.sessionId,
        pointsEarned: data.pointsEarned,
        newStreak: data.newStreak,
        newBadges: data.newBadges,
      }))}; path=/; max-age=600`

      router.push('/done')
    } catch {
      router.push('/done')
    }
  }, [userId, protocol, router])

  const handleComplete = useCallback(() => {
    saveSession(true)
  }, [saveSession])

  const handleSkip = useCallback(() => {
    saveSession(false)
  }, [saveSession])

  if (!protocol) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Loading timer...</p>
      </main>
    )
  }

  return (
    <AmbientTimer
      protocol={protocol}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}