# AGENTS.md — Mental Defrag: Complete Build Guide

## Project Overview

**Product Name:** Mental Defrag  
**Problem Solved:** Students finish heavy study/work sessions and reach for 
Instagram or YouTube as a "break." This does not relieve cognitive load — 
it switches it to a different screen, leaving them more exhausted when they 
return. They don't know HOW to take a real break.  
**The Feature:** A single-input tool that classifies the type of cognitive 
fatigue the user has and generates a hyper-specific 10-minute recovery 
protocol designed for that exact fatigue type.  
**Target User:** Students, self-taught developers, and knowledge workers 
aged 18–28 who finish sessions feeling mentally fried.

## Tech Stack

- **Frontend:** Next.js 15 App Router + Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **AI:** Google Gemini API (model: gemini-2.0-flash)
- **Database + Auth:** Supabase (anonymous UUID → email magic link upgrade)
- **Email:** Resend (placeholder only in V1)
- **Deploy:** Vercel

## Environment Variables (Already Configured)

The .env.local file already contains:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- RESEND_API_KEY
- NEXT_PUBLIC_APP_URL

## Database Schema (Already Created in Supabase)

Two tables already exist:
1. public.users — stores anonymous and identified users
   - id (UUID), email, auth_user_id, total_points, current_streak, 
     longest_streak, last_defrag_date, badges (text array), created_at

2. public.sessions — stores every defrag session
   - id (UUID), user_id, input_text, fatigue_type, intensity, protocol 
     (JSONB), timer_completed, feeling_after, points_earned, created_at

Row Level Security is enabled on both tables.

---

## PHASE 1 — Project Structure Setup

Create the following folder and file structure. 
Create empty files for V2 placeholders — do not build their logic yet.
/app
/page.tsx ← Screen 1: Input page (BUILD)
/result/page.tsx ← Screen 2: Protocol card (BUILD)
/timer/page.tsx ← Screen 3: Ambient timer (BUILD)
/done/page.tsx ← Screen 4: Completion (BUILD)
/auth/callback/route.ts ← Supabase auth callback (BUILD)
/dashboard/page.tsx ← V2 placeholder (empty)
/pricing/page.tsx ← V2 placeholder (empty)
/settings/page.tsx ← V2 placeholder (empty)

/api
/defrag/route.ts ← Gemini API call (BUILD)
/save-session/route.ts ← Save session to Supabase (BUILD)
/save-feeling/route.ts ← Save feeling_after (BUILD)
/send-magic-link/route.ts ← Supabase magic link email (BUILD)
/stripe/webhook/route.ts ← V2 placeholder (empty)
/email/weekly/route.ts ← V2 placeholder (empty)

/lib
/gemini.ts ← Gemini client + prompt (BUILD)
/supabase
/client.ts ← Browser Supabase client (BUILD)
/server.ts ← Server Supabase client (BUILD)
/middleware.ts ← Session refresh middleware (BUILD)
/user.ts ← Anonymous UUID logic (BUILD)
/points.ts ← Points + streak + badges logic (BUILD)

/components
/ui ← shadcn components (already exist)
/FatigueCard.tsx ← Protocol card component (BUILD)
/AmbientTimer.tsx ← Timer component (BUILD)
/StreakDisplay.tsx ← Streak + badges component (BUILD)
/EmailCapture.tsx ← Email opt-in prompt (BUILD)
/FeelingCheck.tsx ← 1-tap feeling feedback (BUILD)
/ShortcutChips.tsx ← Input shortcut buttons (BUILD)

/types
/index.ts ← All TypeScript types (BUILD)

text
---

## PHASE 2 — TypeScript Types

Create `/types/index.ts` with these exact types:

```typescript
export type FatigueType = 'LOGIC' | 'NARRATIVE' | 'VISUAL' | 'EMOTIONAL'
export type Intensity = 'LIGHT' | 'MODERATE' | 'HEAVY'
export type FeelingAfter = 'still_fried' | 'bit_better' | 'much_clearer'

export interface ProtocolStep {
  duration: string
  action: string
  why: string
  avoid: string
}

export interface DefragProtocol {
  fatigueType: FatigueType
  intensity: Intensity
  headline: string
  instagramWarning: string
  steps: ProtocolStep[]
  ambientColor: string
}

export interface Session {
  id: string
  userId: string
  inputText: string
  fatigueType: FatigueType
  intensity: Intensity
  protocol: DefragProtocol
  timerCompleted: boolean
  feelingAfter: FeelingAfter | null
  pointsEarned: number
  createdAt: string
}

export interface UserStats {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  lastDefragDate: string | null
  badges: string[]
  totalSessions: number
  fatigueBreakdown: Record<FatigueType, number>
}
```

---

## PHASE 3 — Supabase Client Setup

### `/lib/supabase/client.ts`
Create the browser-side Supabase client using @supabase/ssr:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `/lib/supabase/server.ts`
Create the server-side Supabase client that reads cookies:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### `middleware.ts` (root level)
Create middleware that refreshes Supabase sessions on every request:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## PHASE 4 — Anonymous User System

### `/lib/user.ts`

This is the core of the anonymous-first auth model. 
Create this file with the following logic:

```typescript
import { createClient } from '@/lib/supabase/client'

const USER_ID_KEY = 'mental_defrag_user_id'

// Get or create an anonymous user UUID stored in localStorage
// On first visit: creates a new record in public.users table
// On return visit: retrieves existing UUID from localStorage
export async function getOrCreateAnonymousUser(): Promise<string> {
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .insert({ email: null, auth_user_id: null })
    .select('id')
    .single()

  if (error) throw error

  localStorage.setItem(USER_ID_KEY, data.id)
  return data.id
}

// Get user stats from Supabase
export async function getUserStats(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('total_points, current_streak, longest_streak, last_defrag_date, badges')
    .eq('id', userId)
    .single()
  return data
}

// Get total session count for this user
export async function getUserSessionCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

// Link anonymous user to a real email after magic link auth
// This merges the anonymous UUID with the Supabase auth user
export async function linkUserToEmail(
  anonymousUserId: string, 
  authUserId: string, 
  email: string
) {
  const supabase = createClient()
  await supabase
    .from('users')
    .update({ email, auth_user_id: authUserId })
    .eq('id', anonymousUserId)
}
```

---

## PHASE 5 — Points, Streak and Badges Logic

### `/lib/points.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

export const BADGES = {
  FIRST_DEFRAG: { id: 'first_defrag', label: 'First Defrag', emoji: '🧠' },
  THREE_DAY_STREAK: { id: 'three_day_streak', label: 'Warm Streak', emoji: '🔥' },
  SEVEN_DAY_STREAK: { id: 'seven_day_streak', label: 'Defrag Habit', emoji: '⚡' },
  FOURTEEN_DAY_STREAK: { id: 'fourteen_day_streak', label: 'Brain Athlete', emoji: '💎' },
  TEN_SESSIONS: { id: 'ten_sessions', label: '10 Defrags', emoji: '🏆' },
}

// Calculate points for a session based on session number today
// Session 1: 10pts, Session 2: 15pts (1.5x), Session 3+: 20pts (2x bonus)
export function calculatePoints(
  timerCompleted: boolean, 
  todaySessionCount: number
): number {
  if (!timerCompleted) return 5
  if (todaySessionCount === 1) return 10
  if (todaySessionCount === 2) return 15
  return 20
}

// Update streak based on last defrag date
// Returns new streak value
export function calculateStreak(
  lastDefragDate: string | null, 
  currentStreak: number
): number {
  if (!lastDefragDate) return 1
  
  const last = new Date(lastDefragDate)
  const today = new Date()
  const diffDays = Math.floor(
    (today.setHours(0,0,0,0) - last.setHours(0,0,0,0)) / 86400000
  )
  
  if (diffDays === 0) return currentStreak  // same day, no change
  if (diffDays === 1) return currentStreak + 1  // consecutive day
  return 1  // streak broken, restart
}

// Check which new badges should be awarded
export function checkNewBadges(
  currentBadges: string[],
  newStreak: number,
  totalSessions: number
): string[] {
  const earned: string[] = []
  
  if (totalSessions >= 1 && !currentBadges.includes(BADGES.FIRST_DEFRAG.id))
    earned.push(BADGES.FIRST_DEFRAG.id)
  if (newStreak >= 3 && !currentBadges.includes(BADGES.THREE_DAY_STREAK.id))
    earned.push(BADGES.THREE_DAY_STREAK.id)
  if (newStreak >= 7 && !currentBadges.includes(BADGES.SEVEN_DAY_STREAK.id))
    earned.push(BADGES.SEVEN_DAY_STREAK.id)
  if (newStreak >= 14 && !currentBadges.includes(BADGES.FOURTEEN_DAY_STREAK.id))
    earned.push(BADGES.FOURTEEN_DAY_STREAK.id)
  if (totalSessions >= 10 && !currentBadges.includes(BADGES.TEN_SESSIONS.id))
    earned.push(BADGES.TEN_SESSIONS.id)
  
  return earned
}

// Write updated stats back to Supabase after a completed session
export async function updateUserStats(
  userId: string,
  pointsEarned: number,
  newStreak: number,
  newBadges: string[]
) {
  const supabase = createClient()
  
  const stats = await supabase
    .from('users')
    .select('total_points, longest_streak, badges')
    .eq('id', userId)
    .single()
  
  if (!stats.data) return
  
  const updatedBadges = [...(stats.data.badges || []), ...newBadges]
  const longestStreak = Math.max(stats.data.longest_streak, newStreak)
  
  await supabase
    .from('users')
    .update({
      total_points: (stats.data.total_points || 0) + pointsEarned,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_defrag_date: new Date().toISOString().split('T'),
      badges: updatedBadges
    })
    .eq('id', userId)
}
```

---

## PHASE 6 — Gemini AI Engine

### `/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { DefragProtocol } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function classifyAndGenerateProtocol(
  userInput: string
): Promise<DefragProtocol> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const prompt = `
You are a neuroscience-backed cognitive recovery specialist with deep 
knowledge of how different types of mental work deplete different brain 
regions, and what specific recovery activities restore them fastest.

A student just finished a session and described it as:
"${userInput}"

You MUST complete ALL four steps below. Do not skip any.

STEP 1 — CLASSIFY FATIGUE TYPE
Map the input to EXACTLY ONE of these four types:
- LOGIC: coding, debugging, math, algorithms, problem-solving, data analysis
- NARRATIVE: reading textbooks, writing essays, memorizing facts, studying history, taking notes
- VISUAL: UI/UX design, watching video tutorials, creating diagrams, video editing, presentations
- EMOTIONAL: exam anxiety, group projects, presentations, conflict, social pressure, impostor syndrome
Rule: If ambiguous, choose the CLOSEST match. Never return null or unknown.

STEP 2 — CLASSIFY INTENSITY
Choose exactly one: LIGHT, MODERATE, or HEAVY
Signals for HEAVY: "all day", "3+ hours", "completely blank", "fried", "exhausted", "can't think"
Signals for MODERATE: "couple hours", "pretty tired", "need a break"
Signals for LIGHT: "30 minutes", "quick session", "a bit tired"

STEP 3 — WRITE THE INSTAGRAM WARNING
One sentence that explains exactly what happens neurologically if they 
open Instagram or YouTube RIGHT NOW. Make it specific and slightly alarming 
so they feel the consequence. Reference the specific brain region affected.

STEP 4 — GENERATE THE 3-STEP RECOVERY PROTOCOL
Each step must be:
- Hyper-specific (not "rest" — say exactly what position, duration, activity)
- Include WHY it works for this specific fatigue type (one sentence, cite brain region)
- Include one thing to AVOID during this step and why it sets back recovery
Steps should be cumulative: 0-3 min, 3-7 min, 7-10 min

AMBIENT COLOR RULES:
- LOGIC → "#4CAF7D" (muted green — nature, movement, eyes forward)
- NARRATIVE → "#3B6B9E" (deep blue — stillness, silence, closed eyes)
- VISUAL → "#D4854A" (warm amber — soft, no screen contrast)
- EMOTIONAL → "#7B5EA7" (soft purple — calm, grounding, safety)

Return ONLY this exact JSON structure, nothing else:
{
  "fatigueType": "LOGIC|NARRATIVE|VISUAL|EMOTIONAL",
  "intensity": "LIGHT|MODERATE|HEAVY",
  "headline": "2-4 word label e.g. Heavy Logic Fatigue",
  "instagramWarning": "Single sentence about neurological consequence",
  "steps": [
    {
      "duration": "0–3 min",
      "action": "Extremely specific action with exact instructions",
      "why": "One sentence citing specific brain region and recovery mechanism",
      "avoid": "Specific thing to avoid and why it delays recovery"
    },
    {
      "duration": "3–7 min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    },
    {
      "duration": "7–10 min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    }
  ],
  "ambientColor": "#hexcode"
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text) as DefragProtocol
}
```

---

## PHASE 7 — API Routes

### `/api/defrag/route.ts`
POST endpoint that accepts { input: string } and returns DefragProtocol.
Call classifyAndGenerateProtocol from /lib/gemini.ts.
Handle errors — if Gemini fails, return 500 with message.
Store the result temporarily using Next.js cookies or 
pass it as a URL-safe base64 encoded query param to /result.
Recommended: store in a httpOnly cookie named "defrag_protocol" 
with 30 minute expiry.

### `/api/save-session/route.ts`
POST endpoint that accepts:
{ userId, inputText, fatigueType, intensity, protocol, timerCompleted, pointsEarned }
1. Inserts into public.sessions table
2. Gets today's session count for this user
3. Calculates points using calculatePoints() from /lib/points.ts
4. Calculates new streak using calculateStreak() from /lib/points.ts
5. Checks for new badges using checkNewBadges() from /lib/points.ts
6. Calls updateUserStats() from /lib/points.ts
7. Returns { sessionId, pointsEarned, newStreak, newBadges }

### `/api/save-feeling/route.ts`
POST endpoint that accepts { sessionId, feelingAfter }
Updates the feeling_after column on the session record.
Returns { success: true }

### `/api/send-magic-link/route.ts`
POST endpoint that accepts { email, userId }
1. Calls supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback' }})
2. Stores the anonymousUserId in a cookie so callback can link them
3. Returns { success: true }

### `/app/auth/callback/route.ts`
GET endpoint that handles Supabase OAuth callback.
1. Exchange code for session using supabase.auth.exchangeCodeForSession
2. Read anonymousUserId from cookie
3. Call linkUserToEmail() from /lib/user.ts
4. Redirect to /done with ?linked=true

---

## PHASE 8 — Reusable Components

### `/components/ShortcutChips.tsx`
Horizontal row of 4 clickable chip buttons. 
Props: { onSelect: (text: string) => void }
Chips and their autofill text:
- 💻 "I just spent time coding and debugging"
- 📖 "I just finished reading and studying from a textbook"  
- ✍️ "I just spent time writing an essay or taking notes"
- 🎨 "I just worked on design and visual creative work"
Style: rounded-full, border, hover:bg-gray-100, small text

### `/components/FatigueCard.tsx`
The protocol output card. 
Props: { protocol: DefragProtocol }
Layout:
- Top: fatigue type badge + intensity chip (color-coded)
- Red/orange warning box with instagramWarning text and ⚠️ icon
- Divider
- 3 steps as vertical timeline
  - Each step: duration badge on left, action text bold, why text muted, 
    avoid text in red-50 collapsible section labeled "What to avoid"
- Bottom: large button "▶ START MY 10-MIN DEFRAG"
  - On click: navigate to /timer with protocol stored in cookie
Card background: use protocol.ambientColor at 10% opacity

### `/components/AmbientTimer.tsx`
Full-screen timer component.
Props: { protocol: DefragProtocol, onComplete: () => void, onSkip: () => void }
State: timeLeft (600 seconds), currentStep (0/1/2), isRunning
Layout:
- Full viewport height
- Background: protocol.ambientColor at 85% opacity
- Center: large countdown display (MM:SS format) in white
- Below: current step card — show step action text, highlight active step
- Step progress: 3 dots at top, filled as each step completes
  Step 1 completes at 7 min remaining, Step 2 at 3 min remaining
- Bottom right corner: "skip" in tiny muted text — calls onSkip()
- On complete (reaches 0): calls onComplete()
Auto-start timer when component mounts.
Prevent screen sleep if possible using WakeLock API.

### `/components/StreakDisplay.tsx`
Shows current streak + total points + badges earned.
Props: { stats: UserStats, newBadges: string[] }
Layout:
- Streak: large fire emoji + number + "day streak" text
- Points: brain emoji + total points
- Badge row: emoji + label for each earned badge
  Newly earned badges should animate in with framer-motion scale bounce
- If streak > 1: show congratulation text based on streak number

### `/components/FeelingCheck.tsx`
Single-use feedback component.
Props: { sessionId: string, onSubmit: (feeling: FeelingAfter) => void }
Three large emoji buttons side by side:
- 😵 "Still fried" → still_fried
- 😐 "A bit better" → bit_better
- 😊 "Much clearer" → much_clearer
On click: calls POST /api/save-feeling, then calls onSubmit()
After selection: show which option was picked with checkmark, disable others.

### `/components/EmailCapture.tsx`
Soft email capture prompt (shown only after session 3+).
Props: { userId: string, onSuccess: () => void, onDismiss: () => void }
Layout:
- Card with subtle border, no modal overlay
- Heading: "Save your streak across all devices"
- Subtext: "We'll also send you a weekly brain performance summary"
- Email input + "Send Magic Link" button
- Small "Not now" text link below
On submit: calls POST /api/send-magic-link
On success: show "Check your email for a magic link ✉️"
On dismiss: hide card permanently by setting localStorage flag

---

## PHASE 9 — The Four App Screens

### `/app/page.tsx` — Screen 1: Input

This is the entry point. Build with these exact elements:

1. HEADER (top, minimal):
   - Logo/wordmark: "Mental Defrag" in medium font
   - Right side: streak indicator if user has existing sessions 
     (pull from localStorage userId → Supabase on mount)

2. HERO SECTION (center of page):
   - Large headline: "What just fried your brain?"
   - Subheadline (muted): "Tell us what you were doing. 
     We'll tell you exactly how to recover."

3. INPUT AREA:
   - Large textarea (4 rows, rounded-xl, border-2)
   - Placeholder: "e.g. I just spent 2 hours debugging a Python script 
     and I can't think straight anymore"
   - Character minimum: 10 characters before submit is enabled
   - ShortcutChips component below textarea

4. SUBMIT BUTTON:
   - Full width, large: "DEFRAG MY BRAIN →"
   - Disabled state when input < 10 chars
   - Loading state: animated brain icon + "Analysing your fatigue..."
   - On submit: POST to /api/defrag, then router.push('/result')

5. FOOTER (bottom, minimal):
   - "Backed by cognitive load science" with small info icon
   - No other links

State management:
- Input text in useState
- Loading boolean in useState
- On mount: call getOrCreateAnonymousUser() from /lib/user.ts
- Store userId in component state + make sure it is initialized

### `/app/result/page.tsx` — Screen 2: Protocol Card

1. Read defrag_protocol from cookie
2. If no cookie: redirect to /
3. Display FatigueCard component with the protocol
4. Below card: "This protocol is designed specifically for [fatigueType] fatigue"
5. On "START MY DEFRAG" click: router.push('/timer')
6. Small text below button: "Only 10 minutes. Your brain will thank you."

### `/app/timer/page.tsx` — Screen 3: Ambient Timer

1. Read defrag_protocol from cookie
2. If no cookie: redirect to /
3. Full screen — hide all navigation
4. Render AmbientTimer component
5. On complete: 
   a. Call POST /api/save-session with timerCompleted: true
   b. Store returned { sessionId, pointsEarned, newStreak, newBadges } in cookie
   c. router.push('/done')
6. On skip:
   a. Call POST /api/save-session with timerCompleted: false
   b. router.push('/done')

### `/app/done/page.tsx` — Screen 4: Completion

This is the reward screen. Build it to feel celebratory but calm.

1. COMPLETION ANIMATION (top):
   - Framer motion: brain icon scales up with a soft pulse
   - Text: "Defrag Complete" fades in
   - Subtext: "Session [N] today" (calculate from today's sessions)

2. STATS SECTION:
   - Render StreakDisplay component with current stats + newBadges
   - Points earned this session: "+[N] Brain Points" with animation

3. FEELING CHECK:
   - Heading: "How do you feel right now?"
   - Render FeelingCheck component
   - This is important data — make it feel easy and natural

4. EMAIL CAPTURE (conditional):
   - Check total session count from Supabase
   - IF totalSessions >= 3 AND user has no email AND localStorage flag not set:
     Show EmailCapture component
   - ELSE: do not show

5. BOTTOM ACTIONS:
   - Primary button: "Start Another Defrag" → router.push('/')
   - Secondary text: "Come back after your next heavy session"

6. Read session data from cookie set in timer page
7. Clear protocol cookie after reading (one-time use)

---

## PHASE 10 — V2 Placeholder Files

Create these files with placeholder content only.
Add a comment at top: "// V2 — Not yet implemented"
Each file should export a default component that renders:
- A centered div saying "[Page Name] — Coming Soon"
This ensures the build compiles and routes work.

Files:
- /app/dashboard/page.tsx
- /app/pricing/page.tsx
- /app/settings/page.tsx
- /api/stripe/webhook/route.ts (return 200 OK for now)
- /api/email/weekly/route.ts (return 200 OK for now)

---

## PHASE 11 — Layout and Global Styles

### `/app/layout.tsx`
- Font: Inter from next/font/google
- Background: #0F0F0F (near black) for dark feel
- Text: #F5F5F5 (near white)
- Accent: #4CAF7D (muted green — Logic fatigue color as brand color)
- Meta: title "Mental Defrag", description "Recover smarter after every session"
- Viewport: width=device-width, initial-scale=1

### `/app/globals.css`
Add these custom utilities:
```css
.ambient-bg {
  transition: background-color 0.8s ease;
}

.protocol-step-active {
  border-left: 3px solid currentColor;
  padding-left: 12px;
}

.fade-in {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## PHASE 12 — Error Handling Rules

Apply these rules throughout the entire codebase:

1. ALL Supabase calls must be wrapped in try/catch
2. ALL Gemini API calls must have a fallback:
   If Gemini fails, return a hardcoded default protocol for LOGIC/HEAVY 
   so the user always gets something useful
3. If localStorage is unavailable (SSR), handle gracefully — 
   check typeof window !== 'undefined' before accessing localStorage
4. Loading states: every button that triggers async work 
   must show a loading state and be disabled during the request
5. Empty states: if user has no sessions yet, show encouraging empty state, 
   not a blank screen

---

## PHASE 13 — Mobile Responsiveness Rules

Every screen must work on mobile (375px width minimum):
- Input textarea: full width, comfortable tap target
- Shortcut chips: wrap to two rows on small screens
- Protocol card: single column, scrollable
- Timer: full viewport height, text centered
- Completion screen: single column, stacked sections
- All buttons: minimum 44px height for touch targets

---

## BUILD SEQUENCE

Build phases in this exact order:
1. Types (/types/index.ts)
2. Supabase clients (/lib/supabase/*)
3. Middleware (middleware.ts)
4. User logic (/lib/user.ts)
5. Points logic (/lib/points.ts)
6. Gemini engine (/lib/gemini.ts)
7. All API routes (/api/*)
8. All components (/components/*)
9. Screen 1 — Input (/app/page.tsx)
10. Screen 2 — Result (/app/result/page.tsx)
11. Screen 3 — Timer (/app/timer/page.tsx)
12. Screen 4 — Done (/app/done/page.tsx)
13. Auth callback (/app/auth/callback/route.ts)
14. V2 placeholders
15. Layout + globals
16. Full flow test

After completing all phases, run `npm run build` and fix any TypeScript 
or compilation errors before considering the build complete.