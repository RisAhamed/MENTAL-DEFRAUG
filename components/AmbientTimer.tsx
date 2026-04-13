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
  const completedRef = useRef(false)

  const currentStep = timeLeft > 420 ? 0 : timeLeft > 180 ? 1 : 2
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch {}
      }
    }

    requestWakeLock()

    return () => {
      wakeLock?.release()
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

  const bgColor = `${protocol.ambientColor}D9`

  function handleSkipClick() {
    const confirmed = window.confirm("Skip the defrag? You'll still earn 5 points.")
    if (confirmed) {
      onSkip()
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden max-w-full flex flex-col items-center justify-center ambient-transition"
      style={{ backgroundColor: bgColor, transitionDuration: '0.5s' }}
    >
      {/* Step progress dots */}
      <div className="flex gap-3 mb-10">
        {protocol.steps.map((_, i) => (
          <div
            key={i}
            className={`relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${
              i < currentStep
                ? 'bg-white'
                : i === currentStep
                  ? 'bg-white scale-[1.3]'
                  : 'bg-white/30'
            }`}
          >
            {i < currentStep && <span className="text-[7px] leading-none text-black">✓</span>}
          </div>
        ))}
      </div>

      {/* Countdown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={timeLeft}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-[clamp(3.5rem,16vw,5rem)] font-mono font-bold text-white tracking-widest">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Current step card */}
      <div className="mt-10 w-full px-4 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[280px] rounded-2xl bg-[rgba(0,0,0,0.25)] p-4"
          >
            <p className="text-center text-sm font-bold text-white">
              {protocol.steps[currentStep].action}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkipClick}
        className="fixed bottom-6 right-6 text-xs text-white/40 hover:text-white/70 transition-colors"
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
