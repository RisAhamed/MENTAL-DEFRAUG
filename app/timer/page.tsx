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

      // Read protocol from sessionStorage (set by result page)
      try {
        const stored = sessionStorage.getItem('defrag_protocol')
        if (stored) {
          setProtocol(JSON.parse(stored))
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
      const inputText = sessionStorage.getItem('defrag_input') || ''

      const res = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inputText,
          fatigueType: protocol.fatigueType,
          intensity: protocol.intensity,
          protocol,
          timerCompleted,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to save session')

      const sessionResult = {
        sessionId: data.sessionId,
        pointsEarned: data.pointsEarned,
        newStreak: data.newStreak,
        longestStreak: data.longestStreak,
        newBadges: data.newBadges,
        totalPoints: data.totalPoints,
        totalSessions: data.totalSessions,
        todaySessionCount: data.todaySessionCount,
        userEmail: data.userEmail,
      }

      const serializedResult = encodeURIComponent(JSON.stringify(sessionResult))
      document.cookie = `session_result=${serializedResult}; path=/; max-age=1800; samesite=lax`

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
