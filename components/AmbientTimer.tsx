'use client'

import { DefragProtocol } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface AmbientTimerProps {
  protocol: DefragProtocol
  onComplete: () => void
  onSkip: () => void
}

export function AmbientTimer({ protocol, onComplete, onSkip }: AmbientTimerProps) {
  const totalSeconds = protocol.totalDuration * 60
  const step1End = Math.floor(totalSeconds * 0.7)
  const step2End = Math.floor(totalSeconds * 0.3)

  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [isRunning] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const [showContextMessage, setShowContextMessage] = useState(false)
  const completedRef = useRef(false)

  const currentStep = timeLeft > step1End ? 0 : timeLeft > step2End ? 1 : 2
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const circumference = 2 * Math.PI * 120
  const progress = timeLeft / totalSeconds
  const dashOffset = circumference * progress

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

    const msgDelay = setTimeout(() => setShowContextMessage(true), 1000)

    return () => {
      wakeLock?.release()
      clearTimeout(msgDelay)
    }
  }, [])

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

  useEffect(() => {
    if (timeLeft !== 0 || completedRef.current) return

    completedRef.current = true
    setShowComplete(true)

    const completeDelay = setTimeout(() => {
      onComplete()
    }, 800)

    return () => clearTimeout(completeDelay)
  }, [timeLeft, onComplete])

  const bgColor = `${protocol.ambientColor}D9`

  function handleSkipClick() {
    const minsLeft = Math.floor(timeLeft / 60)
    const secsLeft = timeLeft % 60
    const timeStr = `${minsLeft}:${secsLeft.toString().padStart(2, '0')}`
    const confirmed = window.confirm(`Skip? You've got ${timeStr} left. Even finishing counts.`)
    if (confirmed) {
      onSkip()
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden max-w-full flex flex-col items-center justify-center ambient-transition"
      style={{ backgroundColor: bgColor, transitionDuration: '0.5s' }}
    >
      {/* Breathing background animation */}
      <motion.div
        className="fixed inset-0"
        animate={{ opacity: [0.85, 0.75, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: protocol.ambientColor }}
      />

      {/* Circular progress arc */}
      <svg width="280" height="280" className="absolute">
        <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="rgba(255,255,255,0.70)"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 140 140)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

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
      <div className="text-center">
        {showComplete ? (
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-[clamp(3.5rem,16vw,5rem)] font-mono font-bold text-white tracking-widest"
          >
            ✓ Done
          </motion.p>
        ) : (
          <p className="text-[clamp(3.5rem,16vw,5rem)] font-mono font-bold text-white tracking-widest">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        )}
      </div>

      {/* Current step card with step-aware color shift */}
      <div className="mt-10 w-full px-4 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24, backgroundColor: `${protocol.ambientColor}66` }}
            animate={{ opacity: 1, x: 0, backgroundColor: `${protocol.ambientColor}40` }}
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

      {/* Context Message at bottom */}
      <AnimatePresence>
        {showContextMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed bottom-16 mx-auto max-w-[260px] text-center text-xs text-white/50"
          >
            {protocol.contextMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <button
        onClick={handleSkipClick}
        className="fixed bottom-6 right-6 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        skip
      </button>

      {/* Completion overlay */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white"
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