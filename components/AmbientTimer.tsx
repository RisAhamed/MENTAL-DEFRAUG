'use client'

import { DefragProtocol } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, useMemo } from 'react'

interface AmbientTimerProps {
  protocol: DefragProtocol
  onComplete: () => void
  onSkip: () => void
}

function Particle({ index }: { index: number }) {
  const props = useMemo(() => ({
    x: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
  }), [])

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${props.x}%`,
        bottom: '-10px',
        width: props.size,
        height: props.size,
        backgroundColor: 'rgba(255,255,255,0.20)',
      }}
      animate={{
        y: [0, -900],
        opacity: [0, 0.35, 0.35, 0],
      }}
      transition={{
        duration: props.duration,
        delay: props.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function AmbientTimer({ protocol, onComplete, onSkip }: AmbientTimerProps) {
  const totalSeconds = protocol.totalDuration * 60
  const step1End = Math.floor(totalSeconds * 0.7)
  const step2End = Math.floor(totalSeconds * 0.3)

  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [isRunning] = useState(true)
  const [showComplete, setShowComplete] = useState(false)
  const [showContextMessage, setShowContextMessage] = useState(false)
  const [ripple, setRipple] = useState(false)
  const completedRef = useRef(false)
  const prevStepRef = useRef(-1)

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

    const msgDelay = setTimeout(() => setShowContextMessage(true), 2000)

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
    }, 1200)

    return () => clearTimeout(completeDelay)
  }, [timeLeft, onComplete])

  useEffect(() => {
    if (prevStepRef.current !== -1 && prevStepRef.current !== currentStep) {
      setRipple(true)
      const t = setTimeout(() => setRipple(false), 600)
      return () => clearTimeout(t)
    }
    prevStepRef.current = currentStep
  }, [currentStep])

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

  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

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

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}

      {/* Step progress dots */}
      <div className="flex gap-3 mb-8">
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

      {/* SVG Arc + Countdown container */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* SVG arc - purely decorative, behind everything */}
        <svg
          width="280"
          height="280"
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track - very subtle */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="2"
          />
          {/* Progress arc */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Countdown text - centered inside, above SVG */}
        {showComplete ? (
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 0.8, 1.3, 1] }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ fontSize: 72, color: '#FFFFFF', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>✓</div>
            <motion.p
              className="text-white font-medium mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Rest complete
            </motion.p>
          </motion.div>
        ) : (
          <div className="relative z-10 text-center">
            <span
              className="font-black tracking-widest"
              style={{
                fontSize: 'clamp(56px, 12vw, 80px)',
                color: '#FFFFFF',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                lineHeight: 1
              }}
            >
              {formattedMinutes}:{formattedSeconds}
            </span>
          </div>
        )}
      </div>

      {/* Step transition ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Current step card with glass effect */}
      <div className="mt-8 w-full px-4 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 24, backgroundColor: 'rgba(0,0,0,0.20)' }}
            animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0.20)' }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[300px] md:max-w-[360px] rounded-2xl border border-white/12 bg-black/20 p-4 backdrop-blur-sm"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            <p className="text-center text-xs text-white/50 uppercase tracking-widest mb-1">
              Step {currentStep + 1} of 3
            </p>
            <p className="text-center text-base font-medium text-white/95 text-center leading-relaxed">
              {protocol.steps[currentStep].action}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Context Message at bottom - fixed, above skip */}
      <AnimatePresence>
        {showContextMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="fixed bottom-[80px] left-0 right-0 mx-auto max-w-[280px] text-center text-xs text-white/65"
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

      {/* Completion background flash */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  )
}