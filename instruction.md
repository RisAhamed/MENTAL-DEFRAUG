You are working on the Mental Defrag project — a Next.js 15 app live 
at https://mental-defraug.vercel.app

Your task is to switch the primary AI provider from Gemini to Groq, 
while keeping Gemini as an automatic fallback.

CRITICAL RULES:
- Read every file FULLY before modifying it
- Do NOT delete any existing working logic
- Run `npm run build` at the end and fix all TypeScript errors

---

STEP 1 — INSTALL GROQ SDK

Run this command:
npm install groq-sdk

---

STEP 2 — CHECK AVAILABLE GROQ MODELS

The primary model to use is: openai/gpt-oss-120b
This is the best currently inference-available model on Groq with 
strong reasoning capability.

Fallback Groq model (if primary is rate limited): openai/gpt-oss-120b
This is the lightweight fast model for when the 70b is overloaded.

Do NOT use any of these (not available for inference):
- Any model with "preview" in the name
- groq-120b (not available for public inference)
- Any Mixtral model (deprecated on Groq)

The model hierarchy is:
1. Groq: openai/gpt-oss-120b  (primary)
2. Groq: llama-3.3-70b-versatile           (Groq fallback if 70b rate limited)
3. Gemini: gemini-2.0-flash       (full fallback if Groq is down)
4. FALLBACK_PROTOCOL constant      (hardcoded fallback if all APIs fail)

---

STEP 3 — CREATE THE GROQ CLIENT

Create a new file: /lib/groq.ts

Content:

import Groq from 'groq-sdk'
import { DefragProtocol } from '@/types'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})
const PRIMARY_MODEL = 'openai/gpt-oss-120b'       // 120B — best quality
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile' // 70B — rate limit fallback  
const GROQ_SPEED_MODEL = 'llama-3.1-8b-instant'   // 8B — speed fallback


// The exact same prompt that was used for Gemini
// Groq's LLaMA models handle JSON mode well
function buildPrompt(userInput: string): string {
  return `You are a neuroscience-backed cognitive recovery specialist with deep knowledge of how different types of mental work deplete different brain regions, and what specific recovery activities restore them fastest.

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

STEP 3 — WRITE THE CONTEXT MESSAGE
One calm sentence that acknowledges what the user just did and why 
this specific rest matters for their brain right now.
Tone rules:
- Sound like a smart friend, not a wellness app
- Reference the specific brain region or cognitive process affected
- Do NOT mention Instagram, YouTube, or social media at all
- Do NOT use alarming language
- DO acknowledge their specific type of work
Examples:
  For LOGIC/HEAVY: "Your prefrontal cortex just ran a marathon — these 10 minutes let it consolidate what you built."
  For NARRATIVE/MODERATE: "The ideas you just processed need 7 quiet minutes to move from working memory into long-term storage."
  For EMOTIONAL/LIGHT: "Your nervous system flagged some stress today — 5 minutes of stillness resets your baseline faster than any distraction."
  For VISUAL/HEAVY: "Your visual cortex has been in overdrive — ambient rest without screens is the only thing that actually clears it."

STEP 4 — DETERMINE TOTAL DURATION
Based on intensity:
- LIGHT → totalDuration: 5
- MODERATE → totalDuration: 7
- HEAVY → totalDuration: 10

STEP 5 — GENERATE THE 3-STEP RECOVERY PROTOCOL
Step durations must match totalDuration:
- LIGHT (5 min):    "0–2 min", "2–4 min", "4–5 min"
- MODERATE (7 min): "0–3 min", "3–5 min", "5–7 min"
- HEAVY (10 min):   "0–3 min", "3–7 min", "7–10 min"

Each step must be:
- Hyper-specific (not "rest" — say exactly what position, duration, activity)
- Include WHY it works for this specific fatigue type (one sentence, cite brain region)
- Include one thing to AVOID during this step and why it sets back recovery

AMBIENT COLOR RULES:
- LOGIC → "#4CAF7D"
- NARRATIVE → "#3B6B9E"
- VISUAL → "#D4854A"
- EMOTIONAL → "#7B5EA7"

Return ONLY valid JSON. No markdown, no code blocks, no explanation:
{
  "fatigueType": "LOGIC|NARRATIVE|VISUAL|EMOTIONAL",
  "intensity": "LIGHT|MODERATE|HEAVY",
  "headline": "2-4 word label",
  "contextMessage": "Single calm sentence",
  "totalDuration": 5,
  "steps": [
    {
      "duration": "0–2 min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    },
    {
      "duration": "2–4 min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    },
    {
      "duration": "4–5 min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    }
  ],
  "ambientColor": "#hexcode"
}`
}

// Parse JSON safely — Groq sometimes wraps in markdown code blocks
function safeParseJSON(text: string): DefragProtocol | null {
  try {
    // Strip markdown code blocks if present
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    return JSON.parse(cleaned) as DefragProtocol
  } catch {
    return null
  }
}

export async function classifyWithGroq(
  userInput: string
): Promise<DefragProtocol | null> {
  const prompt = buildPrompt(userInput)

  // Try primary model first
  try {
    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only response bot. Return only valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const text = completion.choices?.message?.content ?? ''
    const parsed = safeParseJSON(text)
    if (parsed) {
      console.log('[GROQ] Primary model success:', PRIMARY_MODEL)
      return parsed
    }
    throw new Error('Invalid JSON from primary model')

  } catch (primaryError: unknown) {
    const isRateLimit =
      typeof primaryError === 'object' &&
      primaryError !== null &&
      'status' in primaryError &&
      (primaryError as { status: number }).status === 429

    console.warn(
      '[GROQ] Primary model failed:',
      isRateLimit ? 'rate limited' : primaryError
    )

    // Try Groq fallback model
    try {
      const fallbackCompletion = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only response bot. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      })

      const fallbackText = fallbackCompletion.choices?.message?.content ?? ''
      const fallbackParsed = safeParseJSON(fallbackText)
      if (fallbackParsed) {
        console.log('[GROQ] Fallback model success:', FALLBACK_MODEL)
        return fallbackParsed
      }
      return null

    } catch (fallbackError) {
      console.warn('[GROQ] Fallback model also failed:', fallbackError)
      return null
    }
  }
}

---

STEP 4 — UPDATE /lib/gemini.ts TO BE FALLBACK ONLY

Read /lib/gemini.ts fully.

The file should keep classifyAndGenerateProtocol as-is BUT rename it
to classifyWithGemini for clarity.

Also export it under the old name for backwards compatibility:
export { classifyWithGemini as classifyAndGenerateProtocol }

Do not change any logic inside the function — only rename it and 
add the alias export.

---

STEP 5 — CREATE THE UNIFIED AI ORCHESTRATOR

Create a new file: /lib/ai.ts

This file is the single entry point for all AI calls.
All other parts of the codebase import from here, not from gemini.ts 
or groq.ts directly.

Content:

import { classifyWithGroq } from './groq'
import { classifyWithGemini } from './gemini'
import { DefragProtocol } from '@/types'

const FALLBACK_PROTOCOL: DefragProtocol = {
  fatigueType: 'LOGIC',
  intensity: 'HEAVY',
  headline: 'Heavy Logic Fatigue',
  contextMessage: 'Your prefrontal cortex just ran a marathon — these 10 minutes let it consolidate what you built.',
  totalDuration: 10,
  steps: [
    {
      duration: '0–3 min',
      action: 'Stand up and walk to a window. Look at the farthest point outside for 60 seconds without focusing on any object.',
      why: 'Distance viewing deactivates foveal overdrive in your visual cortex caused by hours of screen focus.',
      avoid: "Don't check your phone — blue light prevents the visual cortex reset.",
    },
    {
      duration: '3–7 min',
      action: 'Sit back down, close your eyes, and hum a single low note for 2 minutes. Then do 10 slow neck rolls.',
      why: 'Vagal tone from humming activates your parasympathetic nervous system, countering sympathetic overdrive.',
      avoid: "Don't listen to music with lyrics — language processing re-engages Broca's area.",
    },
    {
      duration: '7–10 min',
      action: 'Drink a full glass of water slowly. Place both palms flat on a table and press down for 30 seconds.',
      why: 'Proprioceptive grounding redirects blood flow from the dorsolateral prefrontal cortex to somatosensory regions.',
      avoid: "Don't read anything — even short text re-engages depleted working memory circuits.",
    },
  ],
  ambientColor: '#4CAF7D',
}

export async function generateProtocol(
  userInput: string
): Promise<{ protocol: DefragProtocol; source: 'groq' | 'gemini' | 'fallback' }> {
  
  // 1. Try Groq first (primary)
  try {
    const groqResult = await classifyWithGroq(userInput)
    if (groqResult) {
      return { protocol: groqResult, source: 'groq' }
    }
  } catch (err) {
    console.warn('[AI] Groq failed entirely, trying Gemini:', err)
  }

  // 2. Try Gemini (secondary fallback)
  try {
    const geminiResult = await classifyWithGemini(userInput)
    if (geminiResult) {
      console.log('[AI] Gemini fallback succeeded')
      return { protocol: geminiResult, source: 'gemini' }
    }
  } catch (err) {
    console.warn('[AI] Gemini also failed, using hardcoded fallback:', err)
  }

  // 3. Hardcoded fallback (never fails)
  console.warn('[AI] All providers failed — using hardcoded fallback protocol')
  return { protocol: FALLBACK_PROTOCOL, source: 'fallback' }
}

---

STEP 6 — UPDATE THE DEFRAG API ROUTE TO USE ORCHESTRATOR

Read /app/api/defrag/route.ts fully.

Find where classifyAndGenerateProtocol is imported and called.

Replace the import:
OLD: import { classifyAndGenerateProtocol } from '@/lib/gemini'
NEW: import { generateProtocol } from '@/lib/ai'

Replace the function call:
OLD: const protocol = await classifyAndGenerateProtocol(input)
NEW: const { protocol, source } = await generateProtocol(input)

Add source to the response for debugging (optional but useful):
Return: { protocol, source } instead of just { protocol }

Keep all existing error handling, timeout logic, and cookie-setting 
logic exactly as it is — only change the import and the call.

---

STEP 7 — UPDATE GENERATE-INSIGHT TO USE GROQ FIRST

Read /app/api/generate-insight/route.ts fully.

This route calls Gemini to generate the surprise insight text.
Update it to use Groq first with Gemini as fallback:

Replace any Gemini calls with this pattern:

// Try Groq first for insight generation
async function generateInsightText(prompt: string): Promise<string | null> {
  // Try Groq
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'You generate short, honest cognitive performance insights. Return only the insight text, no JSON, no formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 120,
    })
    const text = completion.choices?.message?.content?.trim()
    return text || null
  } catch (groqErr) {
    console.warn('[INSIGHT] Groq failed:', groqErr)
  }

  // Fallback to Gemini
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(pr.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text().trim() || null
  } catch (geminiErr) {
    console.warn('[INSIGHT] Gemini also failed:', geminiErr)
    return null
  }
}

Use generateInsightText(prompt) instead of the current Gemini call.
Keep all other logic in the route unchanged.

---

STEP 8 — ADD GROQ_API_KEY TO ENVIRONMENT

Check if /env.example or .env.example exists.
If it does, add this line to it:
GROQ_API_KEY=your_groq_api_key_here

The actual key is already in .env.local — do not touch that file.
Just update the example file for documentation.

---

STEP 9 — ADD GROQ_API_KEY TO VERCEL

This is a manual step — do not code it.
Just create a comment or note in DEPLOY_CHECKLIST.md:

Add to the Environment Variables section:
- [ ] GROQ_API_KEY = (from https://console.groq.com/keys)
  Set in Vercel → Project Settings → Environment Variables
  Required for: primary AI inference (protocol generation + insights)

---

STEP 10 — FINAL BUILD VERIFICATION

Run `npm run build`
Fix ALL TypeScript errors.

Then verify this checklist by reading the code:

[ ] groq-sdk installed in package.json
[ ] /lib/groq.ts created with classifyWithGroq function
[ ] /lib/groq.ts tries openai/gpt-oss-120b first
[ ] /lib/groq.ts falls back to llama-3.3-70b-versatile on rate limit (429)
[ ] /lib/groq.ts returns null on complete failure (does not throw)
[ ] /lib/gemini.ts exports classifyWithGemini (renamed from classifyAndGenerateProtocol)
[ ] /lib/gemini.ts still exports classifyAndGenerateProtocol as alias
[ ] /lib/ai.ts created with generateProtocol function
[ ] /lib/ai.ts tries Groq → Gemini → hardcoded fallback in order
[ ] /lib/ai.ts returns { protocol, source } 
[ ] /app/api/defrag/route.ts imports from /lib/ai.ts not /lib/gemini.ts
[ ] /app/api/generate-insight/route.ts uses Groq first, Gemini as fallback
[ ] No remaining direct Gemini imports in API routes
[ ] .env.local  has GROQ_API_KEY entry
[ ] DEPLOY_CHECKLIST.md has GROQ_API_KEY step
[ ] npm run build passes with zero errors

Report: what was built, what was changed, build status.