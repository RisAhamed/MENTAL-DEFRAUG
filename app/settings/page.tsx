'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateAnonymousUser, getUserStats } from '@/lib/user'

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetInput, setResetInput] = useState('')

  useEffect(() => {
    async function init() {
      const id = await getOrCreateAnonymousUser()
      setUserId(id)
      const stats = await getUserStats(id)
      if (stats) {
        setFirstName(stats.first_name ?? '')
        setEmail(stats.email ?? null)
        setDigestEnabled(stats.digest_enabled ?? true)
      }
    }
    init()
  }, [])

  const saveFirstName = useCallback(async (name: string) => {
    if (!userId || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, firstName: name }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      console.error('Save error:', e)
    } finally {
      setSaving(false)
    }
  }, [userId, saving])

  const toggleDigest = async () => {
    if (!userId) return
    const newValue = !digestEnabled
    setDigestEnabled(newValue)
    try {
      await fetch('/api/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestEnabled: newValue }),
      })
    } catch (e) {
      console.error('Toggle error:', e)
      setDigestEnabled(!newValue)
    }
  }

  const handleReset = async () => {
    if (!userId || resetInput !== 'DELETE') return
    try {
      await fetch('/api/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      localStorage.removeItem('mental_defrag_user_id')
      router.push('/')
    } catch (e) {
      console.error('Reset error:', e)
    }
  }

  const downloadCSV = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      const sessions = data.sessions ?? []
      
      if (sessions.length === 0) return

      const headers = ['Date', 'Fatigue Type', 'Intensity', 'Duration (min)', 'Points']
      const rows = sessions.map((s: { created_at: string; fatigue_type: string; intensity: string; total_duration: number; points_earned: number }) => [
        new Date(s.created_at).toLocaleDateString(),
        s.fatigue_type,
        s.intensity,
        s.total_duration,
        s.points_earned
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mental-defrag-sessions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download error:', e)
    }
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6 bg-[#0F0F0F]">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white text-sm">
          ← Dashboard
        </button>
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <div className="w-20" />
      </header>

      <div className="flex flex-col gap-6">
        {/* SECTION 1: Profile */}
        <section className="bg-[#1A1A1A] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Profile</h2>
          
          {/* Name */}
          <div className="mb-4">
            <label className="text-xs text-[#A0A0A0] block mb-2">Display Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => saveFirstName(firstName)}
                placeholder="What's your name?"
                className="flex-1 min-h-[40px] rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30"
              />
              {saved && <span className="text-green-500 text-xs">✓ Saved</span>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-[#A0A0A0] block mb-2">Email</label>
            {email ? (
              <div className="flex items-center gap-2">
                <p className="text-white">{email}</p>
                <span className="text-[#4CAF7D] text-xs">✓ Streak saved</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 min-h-[40px] rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/30"
                />
                <button className="min-h-[40px] rounded-lg bg-[#4CAF7D] px-4 text-sm font-medium text-white">
                  Save
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: Notifications */}
        <section className="bg-[#1A1A1A] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Notifications</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Weekly Brain Report</p>
              <p className="text-xs text-[#A0A0A0]">Every Monday: your fatigue patterns, streaks, insights</p>
            </div>
            <button
              onClick={toggleDigest}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                digestEnabled ? 'bg-[#4CAF7D]' : 'bg-[#333]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  digestEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          {!email && digestEnabled && (
            <p className="text-xs text-yellow-500 mt-2">Add your email above to enable weekly reports</p>
          )}
        </section>

        {/* SECTION 3: Data */}
        <section className="bg-[#1A1A1A] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Data</h2>
          
          <div className="mb-4">
            <p className="text-sm text-white">Export Your Sessions</p>
            <p className="text-xs text-[#A0A0A0] mb-2">Download all your sessions as CSV</p>
            <button
              onClick={downloadCSV}
              className="min-h-[36px] rounded-lg border border-white/15 px-4 text-sm text-white"
            >
              Download CSV →
            </button>
          </div>

          <div>
            <p className="text-sm text-white/50">Reset All Data</p>
            <p className="text-xs text-[#A0A0A0] mb-2">Permanently delete your sessions and streak</p>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="min-h-[36px] rounded-lg bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.30)] px-4 text-sm text-[#EF4444]"
              >
                Reset →
              </button>
            ) : (
              <div>
                <p className="text-xs text-[#A0A0A0] mb-2">This cannot be undone. Type DELETE to confirm:</p>
                <input
                  type="text"
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full min-h-[36px] rounded-lg border border-[#EF4444]/30 bg-white/5 px-3 text-sm text-white mb-2"
                />
                <button
                  onClick={handleReset}
                  disabled={resetInput !== 'DELETE'}
                  className="min-h-[36px] rounded-lg bg-[#EF4444] px-4 text-sm text-white disabled:opacity-40"
                >
                  Confirm Reset
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: About */}
        <section className="bg-[#1A1A1A] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">About</h2>
          
          <p className="text-sm text-[#A0A0A0]">Mental Defrag v2.0</p>
          <p className="text-xs text-white/30 mb-4">Built for students who work too hard</p>
          
          <button
            onClick={() => router.push('/landing')}
            className="text-sm text-[#4CAF7D] hover:underline"
          >
            Landing Page →
          </button>
        </section>
      </div>
    </main>
  )
}