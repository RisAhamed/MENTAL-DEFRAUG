'use client'

import { DefragProtocol } from '@/types'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'

interface AmbientTimerProps {
  protocol: DefragProtocol
  onComplete: () => void
  onSkip: () => void
}

const TOTAL_SECONDS = 600
const STEP_BOUNDARIES = [0, 180, 420] // step starts at 0s, 180s (3min), 420s (7min)

export function AmbientTimer({ protocol, onComplete, onSkip }: AmbientTimerProps) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [isRunning, setIsRunning] = useState(true)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

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
    if (timeLeft <= 0) {
      onComplete()
      return
    }

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
    if (timeLeft === 0) onComplete()
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
    </div>
  )
}