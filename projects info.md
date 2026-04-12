# Mental Defrag — Complete Project Information

> This document provides full context for resuming development (V2) with a new LLM session. It covers every file, its role, integrations, current development state, and future scope.

---

## 1. Project Overview

**Product:** Mental Defrag
**Tagline:** Recover smarter after every session
**Problem:** Students finish heavy study/work sessions and reach for Instagram or YouTube as a "break." This does not relieve cognitive load — it switches it to a different screen, leaving them more exhausted. They don't know HOW to take a real break.
**Solution:** A single-input tool that classifies the type of cognitive fatigue the user has and generates a hyper-specific 10-minute recovery protocol designed for that exact fatigue type.
**Target User:** Students, self-taught developers, and knowledge workers aged 18–28.
**Current Version:** V1 (fully built, compiles successfully)

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.3 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.1 |
| UI Components | shadcn/ui (base-nova style) | 4.2.0 |
| Animation | Framer Motion | 12.38.0 |
| Icons | Lucide React | 0.511.0 |
| AI Engine | Google Gemini API (gemini-2.0-flash) | @google/generative-ai 0.24.1 |
| Database + Auth | Supabase | @supabase/supabase-js 2.103.0, @supabase/ssr 0.10.2 |
| Email | Resend (placeholder only in V1) | 6.10.0 |
| Deployment | Vercel | — |

**Key Notes:**
- Next.js 16 uses `proxy.ts` instead of `middleware.ts` for request interception
- Tailwind CSS v3 is used (not v4) — the `tailwind.config.ts` uses `hsl(var(...))` color format
- The `globals.css` uses standard `@tailwind base/components/utilities` directives (NOT `@import "shadcn/tailwind.css"` which fails with Turbopack)

---

## 3. Development Stage

### Current State: V1 COMPLETE — Build Passes

All 13 phases from the original AGENTS.md have been implemented:
- TypeScript types defined
- Supabase client/server setup with anonymous auth
- Proxy middleware (Next.js 16 `proxy.ts`) for session refresh
- Anonymous user system (localStorage UUID → Supabase)
- Points, streak, and badges gamification logic
- Gemini AI engine with fallback protocol
- All API routes (defrag, save-session, save-feeling, send-magic-link, auth callback)
- All 6 custom components built
- All 4 app screens built
- V2 placeholder pages created (dashboard, pricing, settings)
- Layout and global styles configured (dark theme)
- Old starter kit files cleaned up
- `npm run build` compiles successfully with zero errors

### What Has NOT Been Done (Known Gaps)

1. **No `.env.local` verification** — The `.env` file exists but has not been validated against actual Supabase/Gemini credentials during runtime
2. **No end-to-end testing** — The full user flow (input → result → timer → done) has not been tested in the browser
3. **`inputText` is empty in save-session** — The timer page passes `inputText: ''` to `/api/save-session` because the original input text is not carried through the cookie chain. This needs to be fixed.
4. **Cookie-based state passing** — Protocol and session result are passed between pages via browser cookies. This is functional but fragile; a better approach would be URL search params or a server-side session store.
5. **No Supabase RLS policy verification** — RLS is enabled on both tables but the policies have not been verified to work with the anonymous user insert pattern
6. **`fatigueBreakdown` is hardcoded to zeros** — The `UserStats.fatigueBreakdown` field always returns `{LOGIC:0, NARRATIVE:0, VISUAL:0, EMOTIONAL:0}` because the aggregation query was not implemented
7. **Old starter kit `app/auth/` directory** — Some auth subdirectories (login, sign-up, etc.) were deleted but the `/auth/error` redirect in the callback route references a page that no longer exists

---

## 4. Environment Variables

File: `.env.example` (template)

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_key_here
RESEND_API_KEY=your_resend_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** The codebase uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). If your `.env` uses the old starter kit variable name `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, you must rename it or add the `ANON_KEY` variable.

---

## 5. Database Schema (Supabase)

Two tables exist with Row Level Security enabled:

### `public.users`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated user UUID |
| email | text (nullable) | Null for anonymous users, set after magic link |
| auth_user_id | UUID (nullable) | Links to Supabase auth.users table after email link |
| total_points | integer | Cumulative brain points |
| current_streak | integer | Consecutive days of defragging |
| longest_streak | integer | All-time best streak |
| last_defrag_date | date | Used for streak calculation |
| badges | text[] | Array of badge IDs earned |
| created_at | timestamptz | Auto-set |

### `public.sessions`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated session UUID |
| user_id | UUID (FK → users.id) | Which user this session belongs to |
| input_text | text | What the user typed describing their fatigue |
| fatigue_type | text | LOGIC / NARRATIVE / VISUAL / EMOTIONAL |
| intensity | text | LIGHT / MODERATE / HEAVY |
| protocol | JSONB | Full DefragProtocol object from Gemini |
| timer_completed | boolean | Did the user finish the 10-min timer |
| feeling_after | text (nullable) | still_fried / bit_better / much_clearer |
| points_earned | integer | Points awarded for this session |
| created_at | timestamptz | Auto-set |

---

## 6. Complete File Inventory

### `/types/index.ts` — TypeScript Type Definitions
All shared types used across the entire app:
- `FatigueType` — Union: `'LOGIC' | 'NARRATIVE' | 'VISUAL' | 'EMOTIONAL'`
- `Intensity` — Union: `'LIGHT' | 'MODERATE' | 'HEAVY'`
- `FeelingAfter` — Union: `'still_fried' | 'bit_better' | 'much_clearer'`
- `ProtocolStep` — Single step in the recovery protocol (duration, action, why, avoid)
- `DefragProtocol` — Full AI-generated protocol (fatigueType, intensity, headline, instagramWarning, steps[], ambientColor)
- `Session` — Database session record type
- `UserStats` — Aggregated user statistics including fatigueBreakdown

**Integrations:** Imported by every component, API route, and lib module that deals with data types.

---

### `/lib/supabase/client.ts` — Browser Supabase Client
Creates a browser-side Supabase client using `@supabase/ssr`'s `createBrowserClient`.
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Called by: `lib/user.ts`, `lib/points.ts` (all client-side Supabase operations)

### `/lib/supabase/server.ts` — Server Supabase Client
Creates a server-side Supabase client that reads cookies via Next.js `cookies()`.
- Uses `createServerClient` from `@supabase/ssr`
- Called by: All API routes (`/api/save-session`, `/api/save-feeling`, `/api/send-magic-link`, `/app/auth/callback/route.ts`)

---

### `/lib/user.ts` — Anonymous User System
Core of the anonymous-first auth model:
- `getOrCreateAnonymousUser()` — Checks localStorage for existing UUID; if none, creates a new anonymous user in `public.users` table and stores the UUID in localStorage under key `mental_defrag_user_id`. Throws if called server-side.
- `getUserStats(userId)` — Fetches total_points, current_streak, longest_streak, last_defrag_date, badges, and email from the users table.
- `getUserSessionCount(userId)` — Returns exact count of sessions for a user.
- `linkUserToEmail(anonymousUserId, authUserId, email)` — Merges an anonymous user with a real Supabase auth user after magic link verification.

**Integrations:** Called by `app/page.tsx` (input screen), `app/timer/page.tsx` (timer screen), `app/done/page.tsx` (completion screen), `app/auth/callback/route.ts` (callback).

---

### `/lib/points.ts` — Gamification Engine
Points, streak, and badge calculation:
- `BADGES` — Object defining 5 badges: First Defrag (🧠), Warm Streak 3-day (🔥), Defrag Habit 7-day (⚡), Brain Athlete 14-day (💎), 10 Defrags (🏆)
- `calculatePoints(timerCompleted, todaySessionCount)` — Points: 5 (skip), 10 (1st session), 15 (2nd), 20 (3rd+)
- `calculateStreak(lastDefragDate, currentStreak)` — Same day: no change; consecutive: +1; gap: reset to 1
- `checkNewBadges(currentBadges, newStreak, totalSessions)` — Returns array of newly earned badge IDs
- `updateUserStats(userId, pointsEarned, newStreak, newBadges)` — Writes updated stats back to Supabase users table

**Integrations:** Called exclusively by `/api/save-session/route.ts` on the server side.

---

### `/lib/gemini.ts` — AI Engine
The core AI module that powers fatigue classification and protocol generation:
- Uses `@google/generative-ai` package, model `gemini-2.0-flash`
- `classifyAndGenerateProtocol(userInput)` — Sends a detailed prompt to Gemini that instructs it to: (1) classify fatigue type, (2) classify intensity, (3) write Instagram warning, (4) generate 3-step recovery protocol
- **Fallback:** If Gemini fails, returns a hardcoded `FALLBACK_PROTOCOL` for LOGIC/HEAVY fatigue with complete steps
- The prompt specifies exact ambient color rules per fatigue type: LOGIC=#4CAF7D, NARRATIVE=#3B6B9E, VISUAL=#D4854A, EMOTIONAL=#7B5EA7
- Returns `DefragProtocol` type parsed from Gemini's JSON response

**Integrations:** Called by `/api/defrag/route.ts`.

---

### `/lib/utils.ts` — Utility Functions
Single export: `cn(...inputs)` — Tailwind CSS class merging utility using `clsx` + `tailwind-merge`. Used by shadcn/ui components.

---

### `/proxy.ts` — Next.js 16 Request Proxy (formerly middleware.ts)
Replaces the old `middleware.ts` pattern. Runs on every request:
- Creates a Supabase server client
- Calls `supabase.auth.getUser()` to refresh the session
- Returns the response with updated cookies
- Matcher: all paths except static assets, images, and favicon

**Integrations:** Automatically invoked by Next.js on every request. No direct imports needed.

---

## 7. API Routes

### `/app/api/defrag/route.ts` — POST
**Purpose:** Classify fatigue and generate recovery protocol
**Input:** `{ input: string }` (minimum 10 characters)
**Process:** Calls `classifyAndGenerateProtocol()` from `lib/gemini.ts`
**Output:** `DefragProtocol` JSON
**Side effect:** Sets `defrag_protocol` cookie (30-min expiry, path=/) so result and timer pages can read it

### `/app/api/save-session/route.ts` — POST
**Purpose:** Save a completed/skipped defrag session and update gamification stats
**Input:** `{ userId, inputText, fatigueType, intensity, protocol, timerCompleted }`
**Process:**
1. Insert into `public.sessions`
2. Count today's sessions for this user
3. Count total sessions
4. Fetch user's current streak and badges
5. Calculate points via `calculatePoints()`
6. Calculate streak via `calculateStreak()`
7. Check new badges via `checkNewBadges()`
8. Update session's points_earned
9. Update user stats via `updateUserStats()`
**Output:** `{ sessionId, pointsEarned, newStreak, newBadges }`

### `/app/api/save-feeling/route.ts` — POST
**Purpose:** Save the user's post-session feeling feedback
**Input:** `{ sessionId, feelingAfter }` (FeelingAfter type)
**Process:** Updates `feeling_after` column on the session record
**Output:** `{ success: true }`

### `/app/api/send-magic-link/route.ts` — POST
**Purpose:** Send a Supabase magic link email for anonymous-to-identified user upgrade
**Input:** `{ email, userId }`
**Process:**
1. Calls `supabase.auth.signInWithOtp()` with email redirect to `/auth/callback`
2. Stores `anonymous_user_id` in a 10-minute cookie for the callback to use
**Output:** `{ success: true }`

### `/app/auth/callback/route.ts` — GET
**Purpose:** Handle Supabase OAuth callback after magic link click
**Process:**
1. Exchanges code for session via `supabase.auth.exchangeCodeForSession()`
2. Reads `anonymous_user_id` from cookie
3. If present, calls `linkUserToEmail()` to merge anonymous user with auth user
4. Redirects to `/done?linked=true`
5. On failure, redirects to `/auth/error` (NOTE: this page was deleted — needs fix)

### `/app/api/stripe/webhook/route.ts` — POST (V2 placeholder)
Returns `{ received: true }`. No logic.

### `/app/api/email/weekly/route.ts` — POST (V2 placeholder)
Returns `{ received: true }`. No logic.

---

## 8. Components

### `/components/ShortcutChips.tsx`
**Purpose:** Horizontal row of 4 quick-fill chip buttons for the input screen
**Props:** `{ onSelect: (text: string) => void }`
**Behavior:** Each chip auto-fills the textarea with a pre-written description of a fatigue scenario
- 💻 "I just spent time coding and debugging"
- 📖 "I just finished reading and studying from a textbook"
- ✍️ "I just spent time writing an essay or taking notes"
- 🎨 "I just worked on design and visual creative work"
**Styling:** `rounded-full`, border, hover:bg-white/10, small text, wraps to 2 rows on mobile

### `/components/FatigueCard.tsx`
**Purpose:** Displays the full AI-generated recovery protocol in a card layout
**Props:** `{ protocol: DefragProtocol }`
**Structure:**
- Top: Fatigue type badge + intensity chip (color-coded: LIGHT=green, MODERATE=yellow, HEAVY=red)
- Red warning box with Instagram warning and ⚠️ icon
- Divider
- 3 steps as expandable timeline rows (click to reveal "What to avoid" section)
- Each step: duration badge, action text (bold), why text (muted), avoid text (red, collapsible)
- Bottom: "START MY 10-MIN DEFRAG" button → navigates to `/timer`
- Card background: ambientColor at ~10% opacity
**Dependencies:** framer-motion, lucide-react, useRouter from next/navigation

### `/components/AmbientTimer.tsx`
**Purpose:** Full-screen 10-minute countdown timer with ambient background
**Props:** `{ protocol: DefragProtocol, onComplete: () => void, onSkip: () => void }`
**State:** timeLeft (600s countdown), currentStep (0/1/2), isRunning (auto-starts)
**Features:**
- Full viewport height, ambientColor at ~85% opacity background
- Large MM:SS countdown in white monospace font
- 3 step progress dots (filled as each step completes at 7min, 3min remaining)
- Current step card showing action text
- "skip" link in bottom-right corner
- **WakeLock API** — Requests screen wake lock to prevent phone from sleeping
- Auto-starts on mount
**Dependencies:** framer-motion, DefragProtocol type

### `/components/StreakDisplay.tsx`
**Purpose:** Shows gamification stats — streak, points, and earned badges
**Props:** `{ stats: UserStats, newBadges: string[] }`
**Behavior:**
- Large fire emoji + streak number + "day streak"
- Brain emoji + total points
- Badge row: each earned badge shown as pill with emoji + label
- Newly earned badges animate in with framer-motion spring bounce
- Congratulation text varies by streak length (1, 3+, 7+)
**Dependencies:** framer-motion, BADGES map from lib/points.ts

### `/components/FeelingCheck.tsx`
**Purpose:** One-tap post-session feeling feedback
**Props:** `{ sessionId: string, onSubmit: (feeling: FeelingAfter) => void }`
**Behavior:**
- 3 large emoji buttons: 😵 Still fried, 😐 A bit better, 😊 Much clearer
- On click: POSTs to `/api/save-feeling`, then calls onSubmit()
- After selection: shows checkmark on chosen option, disables others (grays out)
**Dependencies:** None beyond React and types

### `/components/EmailCapture.tsx`
**Purpose:** Soft email capture prompt shown only after session 3+
**Props:** `{ userId: string, onSuccess: () => void, onDismiss: () => void }`
**Behavior:**
- Card with heading "Save your streak across all devices"
- Subtext about weekly brain performance summary
- Email input + "Send Magic Link" button
- On submit: POSTs to `/api/send-magic-link`, on success shows "Check your email for a magic link ✉️"
- "Not now" dismiss link — sets localStorage flag `mental_defrag_email_dismissed` to permanently hide
**Dependencies:** None beyond React

### shadcn/ui Components (`/components/ui/`)
Pre-built shadcn/ui components installed for potential use:
- `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `progress.tsx`, `textarea.tsx`
- Currently the custom components use Tailwind CSS classes directly rather than these shadcn components. They are available for V2 use.

---

## 9. App Screens (Pages)

### `/app/page.tsx` — Screen 1: Input (HOME)
**Route:** `/`
**Type:** Client component ('use client')
**Purpose:** The main entry point where users describe their mental fatigue
**Key Elements:**
- Header: Brain icon + "Mental Defrag" wordmark + streak indicator (if returning user)
- Hero: "What just fried your brain?" headline + subheadline
- Textarea: 4 rows, rounded-xl, border-2, 10-character minimum
- ShortcutChips component below textarea
- Submit button: "DEFRAG MY BRAIN →" (disabled under 10 chars, shows spinner + "Analysing your fatigue..." when loading)
- Footer: "Backed by cognitive load science" with info icon
**Data Flow:**
1. On mount: calls `getOrCreateAnonymousUser()` → stores userId in state
2. On mount: fetches user stats + session count
3. On submit: POSTs to `/api/defrag` with input text
4. On success: `router.push('/result')` — protocol is already in cookie from the API response

### `/app/result/page.tsx` — Screen 2: Protocol Card
**Route:** `/result`
**Type:** Client component
**Purpose:** Display the AI-generated recovery protocol
**Key Elements:**
- Reads `defrag_protocol` from browser cookie (redirects to `/` if missing)
- Renders `FatigueCard` component with the protocol
**Data Flow:** Cookie → JSON parse → DefragProtocol → FatigueCard

### `/app/timer/page.tsx` — Screen 3: Ambient Timer
**Route:** `/timer`
**Type:** Client component
**Purpose:** Full-screen 10-minute countdown with step guidance
**Key Elements:**
- Reads `defrag_protocol` from cookie (redirects to `/` if missing)
- Gets userId from `getOrCreateAnonymousUser()`
- Renders `AmbientTimer` component
**Data Flow:**
1. On complete: POSTs to `/api/save-session` with `timerCompleted: true`
2. Stores session result (sessionId, points, streak, badges) in `defrag_result` cookie
3. `router.push('/done')`
4. On skip: Same flow but `timerCompleted: false`

### `/app/done/page.tsx` — Screen 4: Completion
**Route:** `/done`
**Type:** Client component
**Purpose:** Celebration screen with stats, feeling check, and optional email capture
**Key Elements:**
- Animated brain icon with pulse
- "Defrag Complete" heading + "Session N today"
- StreakDisplay component with current stats + new badges
- "+N Brain Points" animated text
- FeelingCheck component (3-emoji feedback)
- EmailCapture component (conditional: session count >= 3, no email stored, not dismissed)
- "Start Another Defrag" button → `/`
**Data Flow:**
1. Reads `defrag_result` cookie → clears it after reading (one-time use)
2. Fetches fresh user stats from Supabase
3. If session 3+ and no email: shows EmailCapture

### `/app/auth/callback/route.ts` — Auth Callback
**Route:** `/auth/callback` (GET)
**Purpose:** Handles magic link OAuth callback
**See API Routes section above for details**

### V2 Placeholder Pages
- `/app/dashboard/page.tsx` — Shows "Dashboard — Coming Soon"
- `/app/pricing/page.tsx` — Shows "Pricing — Coming Soon"
- `/app/settings/page.tsx` — Shows "Settings — Coming Soon"

---

## 10. Configuration Files

| File | Purpose |
|---|---|
| `proxy.ts` | Next.js 16 request proxy (session refresh middleware) |
| `next.config.ts` | `cacheComponents: true` enabled |
| `tailwind.config.ts` | Tailwind v3 config with shadcn color variables (hsl format), darkMode: class, tailwindcss-animate plugin |
| `postcss.config.mjs` | PostCSS with tailwindcss + autoprefixer |
| `tsconfig.json` | TypeScript strict mode, path alias `@/*` → `./*` |
| `components.json` | shadcn/ui config: style `base-nova`, RSC enabled, Tailwind v3 CSS variables |
| `app/globals.css` | Dark theme CSS variables, custom `.ambient-bg`, `.protocol-step-active`, `.fade-in` animations |
| `app/layout.tsx` | Root layout: Inter font, bg #0F0F0F, text #F5F5F5, metadata "Mental Defrag" |

---

## 11. Data Flow: Complete User Journey

```
1. User visits /
   → getOrCreateAnonymousUser() creates/fetches UUID from localStorage
   → getUserStats() fetches streak display for header

2. User types fatigue description → clicks "DEFRAG MY BRAIN →"
   → POST /api/defrag { input }
   → Gemini classifies fatigue + generates protocol
   → Response sets defrag_protocol cookie (30 min)
   → router.push('/result')

3. /result page reads defrag_protocol cookie
   → FatigueCard displays protocol
   → User clicks "START MY 10-MIN DEFRAG"
   → router.push('/timer')

4. /timer page reads defrag_protocol cookie
   → AmbientTimer starts 10-minute countdown
   → On complete or skip:
     → POST /api/save-session { userId, inputText, fatigueType, intensity, protocol, timerCompleted }
     → Server: inserts session, calculates points/streak/badges, updates user stats
     → Response sets defrag_result cookie (10 min)
     → router.push('/done')

5. /done page reads defrag_result cookie (one-time, clears after)
   → Shows completion animation, stats, points, badges
   → FeelingCheck: POST /api/save-feeling { sessionId, feelingAfter }
   → If session 3+: EmailCapture: POST /api/send-magic-link { email, userId }
   → "Start Another Defrag" → router.push('/')
```

---

## 12. Cookie Usage Summary

| Cookie Name | Set By | Read By | Expiry | Purpose |
|---|---|---|---|---|
| `defrag_protocol` | /api/defrag | /result, /timer | 30 min | Pass AI protocol between pages |
| `defrag_result` | /timer (client) | /done | 10 min | Pass session stats to completion screen |
| `anonymous_user_id` | /api/send-magic-link | /auth/callback | 10 min | Link anonymous user after magic link |

---

## 13. Supabase RLS Considerations

Both tables have Row Level Security enabled. The current code uses:
- **Client-side inserts** (from `lib/user.ts` and the browser Supabase client) — these use the anon key and will be subject to RLS policies
- **Server-side queries** (from API routes using `lib/supabase/server.ts`) — these also use the anon key by default

**RLS policies must allow:**
- Anonymous users to INSERT into `public.users` (for `getOrCreateAnonymousUser()`)
- Anonymous users to SELECT/UPDATE their own row in `public.users`
- Anonymous users to INSERT into `public.sessions`
- Anonymous users to SELECT their own sessions from `public.sessions`

If these policies are not configured correctly, the anonymous user flow will fail silently. Verify in Supabase Dashboard → Authentication → Policies.

---

## 14. Future Scope (V2)

### High Priority
1. **Dashboard page** (`/dashboard`) — Session history, fatigue type breakdown chart, streak calendar, weekly trends
2. **Pricing page** (`/pricing`) — Stripe integration for premium features (already have `resend` and stripe webhook placeholder)
3. **Settings page** (`/settings`) — User preferences, notification settings, account management
4. **Fix `inputText` not being saved** — Pass the user's original input text through the cookie chain so it's stored in the session record
5. **Implement `fatigueBreakdown` aggregation** — Query sessions table to compute per-type counts for UserStats
6. **Fix `/auth/error` redirect** — The callback route redirects to `/auth/error` but this page was deleted. Create it or redirect elsewhere.
7. **Cookie-based state → server state** — Replace cookie passing with server-side session storage or URL params for more reliability

### Medium Priority
8. **Weekly email report** — Use Resend to send weekly brain performance summaries (API route placeholder exists)
9. **Stripe payments** — Wire up the webhook, create checkout sessions, premium tier
10. **Mobile PWA** — Add manifest.json, service worker, install prompt
11. **Push notifications** — Remind users to defrag after long sessions
12. **Social sharing** — Share streak/badge achievements
13. **Audio guidance** — Play ambient sounds or voice instructions during timer

### Lower Priority
14. **Multi-language support** — i18n for non-English users
15. **Custom protocol editor** — Let users tweak their recovery steps
16. **Therapist/partner API** — Share anonymized fatigue data with counselors
17. **Wearable integration** — Connect to Apple Health / Fitbit for objective fatigue data

---

## 15. Key Technical Decisions & Notes for V2 Developer

1. **Next.js 16 proxy.ts, NOT middleware.ts** — Do not create a `middleware.ts` file. It will conflict with `proxy.ts` and break the build.
2. **Supabase env var name** — Code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The old starter kit used `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Make sure `.env` has the right name.
3. **Gemini model** — Currently `gemini-2.0-flash`. If you upgrade to `gemini-2.5-pro` or another model, update `lib/gemini.ts`.
4. **Dark theme only** — The app is designed as dark-only (#0F0F0F background). The `next-themes` package is still installed but the layout no longer includes ThemeProvider. If you want theme switching, add it back.
5. **All pages are client components** — Every page uses `'use client'` because they need localStorage and browser APIs. If you want server components for any page, significant refactoring is needed.
6. **shadcn/ui components are installed but mostly unused** — The custom components use Tailwind classes directly. The shadcn components are available in `/components/ui/` for V2 use.
7. **Old starter kit cleanup is complete** — All old auth pages, tutorial components, and starter-specific files have been deleted. The only remnant is the `app/auth/callback/route.ts` which is used by Mental Defrag's magic link flow.

---

## 16. Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

The dev server starts at `http://localhost:3000` by default.

---

## 17. File Tree (Final State)

```
/
├── .env                          # Environment variables (NOT committed)
├── .env.example                  # Template for env vars
├── .mcp.json                     # MCP server config
├── AGENTS.md                     # Original build guide (all phases)
├── projects info.md              # THIS DOCUMENT
├── proxy.ts                      # Next.js 16 request proxy (session refresh)
├── next.config.ts                # Next.js config (cacheComponents: true)
├── tailwind.config.ts            # Tailwind v3 + shadcn colors
├── postcss.config.mjs            # PostCSS config
├── tsconfig.json                 # TypeScript config (@/* alias)
├── components.json               # shadcn/ui config
├── package.json                  # Dependencies and scripts
│
├── types/
│   └── index.ts                  # All TypeScript types
│
├── lib/
│   ├── utils.ts                  # cn() Tailwind class merger
│   ├── user.ts                   # Anonymous user system
│   ├── points.ts                 # Points, streak, badges gamification
│   ├── gemini.ts                 # Gemini AI engine + fallback
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client
│
├── components/
│   ├── ShortcutChips.tsx         # Quick-fill input buttons
│   ├── FatigueCard.tsx           # Protocol display card
│   ├── AmbientTimer.tsx          # Full-screen 10-min timer
│   ├── StreakDisplay.tsx         # Streak + points + badges
│   ├── FeelingCheck.tsx          # 3-emoji feeling feedback
│   ├── EmailCapture.tsx          # Soft email opt-in prompt
│   └── ui/                       # shadcn/ui components (10 files)
│
├── app/
│   ├── layout.tsx                # Root layout (Inter font, dark bg)
│   ├── globals.css               # CSS variables + animations
│   ├── page.tsx                  # Screen 1: Input
│   ├── result/page.tsx           # Screen 2: Protocol card
│   ├── timer/page.tsx            # Screen 3: Ambient timer
│   ├── done/page.tsx             # Screen 4: Completion
│   ├── dashboard/page.tsx        # V2 placeholder
│   ├── pricing/page.tsx          # V2 placeholder
│   ├── settings/page.tsx         # V2 placeholder
│   ├── favicon.ico
│   ├── opengraph-image.png
│   ├── twitter-image.png
│   │
│   ├── auth/
│   │   └── callback/route.ts     # Magic link OAuth callback
│   │
│   └── api/
│       ├── defrag/route.ts       # Gemini AI endpoint
│       ├── save-session/route.ts # Save session + update stats
│       ├── save-feeling/route.ts # Save feeling feedback
│       ├── send-magic-link/route.ts # Send magic link email
│       ├── stripe/webhook/route.ts   # V2 placeholder
│       └── email/weekly/route.ts     # V2 placeholder
```