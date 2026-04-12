'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DefragProtocol } from '@/types'
import { FatigueCard } from '@/components/FatigueCard'

export default function ResultPage() {
  const router = useRouter()
  const [protocol, setProtocol] = useState<DefragProtocol | null>(null)

  useEffect(() => {
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
  }, [router])

  if (!protocol) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Loading protocol...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <FatigueCard protocol={protocol} />
      <p className="text-xs text-white/30 mt-4">Only 10 minutes. Your brain will thank you.</p>
    </main>
  )
}