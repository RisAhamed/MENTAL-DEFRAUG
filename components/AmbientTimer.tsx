'use client'

import { DefragProtocol } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface AmbientTimerProps {
  protocol: DefragProtocol
  onComplete: () => void
  onSkip: () => void
}

const TOTAL_SECONDS = 600

export function AmbientTimer({ protocol, onComplete, onSkip }: AmbientTimerProps) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [isRunning] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const completedRef = useRef(false)

  const currentStep = timeLeft > 420 ? 0 : timeLeft > 180 ? 1 : 2
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Request Wake Lock to prevent screen sleep
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    requestWakeLock()
    return () => {
      wakeLockRef.current?.release()
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (!isRunning) return
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, onComplete])

  // Check completion
  useEffect(() => {
    if (timeLeft !== 0 || completedRef.current) return

    completedRef.current = true
    setShowComplete(true)

    const completeDelay = setTimeout(() => {
      onComplete()
    }, 2200)

    return () => clearTimeout(completeDelay)
  }, [timeLeft, onComplete])

  const bgColor = protocol.ambientColor + 'D9' // ~85% opacity

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center ambient-bg"
      style={{ backgroundColor: bgColor }}
    >
      {/* Step progress dots */}
      <div className="flex gap-3 mb-12">
        {protocol.steps.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              i <= currentStep ? 'bg-white scale-125' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Countdown */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <p className="text-7xl font-mono font-bold text-white tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </motion.div>

      {/* Current step card */}
      <div className="mt-12 max-w-md w-full mx-4">
        <div className="rounded-xl bg-black/30 backdrop-blur-sm p-5 border border-white/10">
          <p className="text-xs text-white/60 mb-1">
            Step {currentStep + 1} of 3 — {protocol.steps[currentStep].duration}
          </p>
          <p className="text-sm text-white font-medium">
            {protocol.steps[currentStep].action}
          </p>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute bottom-8 right-8 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        skip
      </button>

      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.86, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-sm rounded-lg border border-white/20 bg-black/50 p-6 text-center shadow-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.14, 1] }}
                transition={{ duration: 0.8, repeat: 1, ease: 'easeInOut' }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl"
              >
                🧠
              </motion.div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                Defrag complete
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Your brain got its reset.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                You stayed with the recovery instead of switching screens. That is the rep.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
