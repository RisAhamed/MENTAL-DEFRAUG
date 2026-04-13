'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const FATIGUE_COLORS = {
  LOGIC: '#4CAF7D',
  NARRATIVE: '#3B6B9E',
  VISUAL: '#D4854A',
  EMOTIONAL: '#7B5EA7',
} as const

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#0F0F0F]/90 px-4 py-4 backdrop-blur-sm"
      >
        <div className="text-xl font-bold text-[#F5F5F5]">Mental Defrag</div>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg bg-[#4CAF7D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4CAF7D]/90"
        >
          Open App →
        </button>
      </motion.nav>

      {/* Section 1 - Hero */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-4 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-[#F5F5F5] md:text-6xl"
        >
          What kind of tired are you?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-[#A0A0A0] md:text-xl"
        >
          You just finished studying. Before you open Instagram — wait 10 minutes.
          Your brain needs a specific kind of recovery. Not more screens.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onClick={() => router.push('/')}
          className="mt-8 min-h-[56px] rounded-xl bg-[#4CAF7D] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#4CAF7D]/90"
        >
          Defrag My Brain — Free
        </motion.button>
        <p className="mt-4 text-sm text-white/40">No account needed. Works in 10 minutes.</p>
      </section>

      {/* Section 2 - The Problem */}
      <section className="bg-[#1A1A1A] px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-[#F5F5F5]">
          Why your Instagram break isn&apos;t working
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#242424] p-6"
          >
            <div className="text-4xl">🧠</div>
            <h3 className="mt-4 text-lg font-semibold text-[#F5F5F5]">Your brain is still active</h3>
            <p className="mt-2 text-sm text-[#A0A0A0]">
              Scrolling Instagram uses the same visual cortex you just exhausted studying.
              It doesn&apos;t rest — it switches channels.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#242424] p-6"
          >
            <div className="text-4xl">⚡</div>
            <h3 className="mt-4 text-lg font-semibold text-[#F5F5F5]">You have 4 types of fatigue</h3>
            <p className="mt-2 text-sm text-[#A0A0A0]">
              Logic fatigue, narrative fatigue, visual fatigue, emotional fatigue.
              Each needs a completely different recovery protocol.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#242424] p-6"
          >
            <div className="text-4xl">⏱️</div>
            <h3 className="mt-4 text-lg font-semibold text-[#F5F5F5]">10 minutes is all it takes</h3>
            <p className="mt-2 text-sm text-[#A0A0A0]">
              A protocol matched to your exact fatigue type can restore working memory
              capacity significantly faster than passive scrolling.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 3 - How It Works */}
      <section className="bg-[#0F0F0F] px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-[#F5F5F5]">How it works</h2>
        <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-6 md:flex-row md:justify-between">
          {[
            { num: '1', title: 'Describe your session', sub: "Tell us what you were working on. Takes 10 seconds." },
            { num: '2', title: 'Get your protocol', sub: "AI classifies your fatigue type and generates a specific 10-minute recovery sequence." },
            { num: '3', title: 'Run the timer', sub: "Follow the protocol. No willpower needed — just follow steps." },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-1 items-start gap-4"
            >
              <span className="text-4xl font-bold text-white/15">{step.num}</span>
              <div>
                <h3 className="text-lg font-semibold text-[#F5F5F5]">{step.title}</h3>
                <p className="mt-1 text-sm text-[#A0A0A0]">{step.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4 - Fatigue Types */}
      <section className="bg-[#1A1A1A] px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-[#F5F5F5]">
          The 4 types of cognitive fatigue
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          {[
            { type: 'LOGIC', emoji: '💻', color: FATIGUE_COLORS.LOGIC, desc: 'Coding, debugging, math, algorithms' },
            { type: 'NARRATIVE', emoji: '📖', color: FATIGUE_COLORS.NARRATIVE, desc: 'Reading, writing, memorizing, studying' },
            { type: 'VISUAL', emoji: '🎨', color: FATIGUE_COLORS.VISUAL, desc: 'Design, video tutorials, presentations' },
            { type: 'EMOTIONAL', emoji: '😓', color: FATIGUE_COLORS.EMOTIONAL, desc: 'Exams, group projects, presentations, pressure' },
          ].map((fatigue) => (
            <motion.div
              key={fatigue.type}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1A1A1A] p-5"
              style={{ borderLeftWidth: 4, borderLeftColor: fatigue.color }}
            >
              <h3 className="text-lg font-semibold text-[#F5F5F5]">
                {fatigue.emoji} {fatigue.type} Fatigue
              </h3>
              <p className="mt-1 text-sm text-[#A0A0A0]">{fatigue.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 5 - Social Proof */}
      <section className="bg-[#0F0F0F] px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-[#F5F5F5]">What students say</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            {
              quote: "I used to open YouTube after studying and wonder why I felt more tired an hour later. This explained everything.",
              name: 'Arjun S.',
              role: 'Computer Science, 2nd year',
            },
            {
              quote: "The timer actually works. I kept thinking I'd skip it but following the steps genuinely made my head feel clearer.",
              name: 'Priya M.',
              role: 'Medical student',
            },
            {
              quote: "Scary how specific it is. It told me I had emotional fatigue from my presentation prep and gave me a breathing protocol. It was right.",
              name: 'Keerthana R.',
              role: 'Engineering student',
            },
          ].map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1A1A1A] p-6"
            >
              <p className="italic text-[#F5F5F5]">&ldquo;{testimonial.quote}&rdquo;</p>
              <p className="mt-3 text-sm text-[#A0A0A0]">
                {testimonial.name} — &ldquo;{testimonial.role}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 6 - Final CTA */}
      <section className="bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A] px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-[#F5F5F5]">
          Your brain built your future. Protect it.
        </h2>
        <button
          onClick={() => router.push('/')}
          className="mt-8 min-h-[56px] rounded-xl bg-[#4CAF7D] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#4CAF7D]/90"
        >
          Start Your First Defrag — Free
        </button>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-[#A0A0A0]">
          <span>✅ No account needed</span>
          <span>✅ Works in 10 minutes</span>
          <span>✅ Free forever</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-[#A0A0A0]">
        Mental Defrag © 2026 — Built for students who work too hard
      </footer>
    </div>
  )
}