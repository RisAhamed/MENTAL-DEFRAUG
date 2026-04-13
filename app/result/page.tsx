'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
    <main className="min-h-screen max-w-full overflow-x-hidden bg-[#0F0F0F] px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-[#606060] text-sm hover:text-white flex items-center gap-1"
          >
            ← Back
          </button>
        </div>
        <FatigueCard protocol={protocol} />
      </motion.div>
    </main>
  )
}