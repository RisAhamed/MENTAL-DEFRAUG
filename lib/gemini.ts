import { GoogleGenerativeAI } from '@google/generative-ai'
import { DefragProtocol } from '@/types'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables')
}

const genAI = new GoogleGenerativeAI(API_KEY)

const FALLBACK_PROTOCOL: DefragProtocol = {
  fatigueType: 'LOGIC',
  intensity: 'HEAVY',
  headline: 'Heavy Logic Fatigue',
  contextMessage: 'Your prefrontal cortex just ran a marathon — these 10 minutes let it actually consolidate what you built.',
  totalDuration: 10,
  steps: [
    {
      duration: '0–3 min',
      action: 'Stand up and walk to a window. Look at the farthest point outside for 60 seconds without focusing on any object.',
      why: 'Distance viewing deactivates the foveal overdrive in your visual cortex caused by hours of screen focus.',
      avoid: "Don't check your phone — blue light resets your melatonin recovery cycle.",
    },
    {
      duration: '3–7 min',
      action: 'Sit back down, close your eyes, and hum a single low note for 2 minutes. Then do 10 slow neck rolls.',
      why: 'Vagal tone from humming activates your parasympathetic nervous system, countering the sympathetic overdrive from debugging.',
      avoid: "Don't listen to music with lyrics — language processing re-engages Broca's area.",
    },
    {
      duration: '7–10 min',
      action: 'Drink a full glass of water slowly. Then place both palms flat on a table and press down for 30 seconds. Release and notice the warmth.',
      why: 'Proprioceptive grounding redirects blood flow from the dorsolateral prefrontal cortex to somatosensory regions, accelerating recovery.',
      avoid: "Don't read anything — even short text re-engages your depleted working memory circuits.",
    },
  ],
  ambientColor: '#4CAF7D',
}

export async function classifyAndGenerateProtocol(
  userInput: string
): Promise<DefragProtocol> {
  if (!genAI) {
    console.error('[GEMINI] genAI not initialized')
    return FALLBACK_PROTOCOL
  }
  
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })

    const prompt = `
You are a neuroscience-backed cognitive recovery specialist with deep knowledge of how different types of mental work deplete different brain regions, and what specific recovery activities restore them fastest.

A student just finished a session and described it as:
"${userInput}"

You MUST complete ALL steps below. Do not skip any.

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

STEP 3 — DETERMINE TOTAL DURATION
Based on intensity:
- LIGHT → 5 (5 minutes total)
- MODERATE → 7 (7 minutes total)
- HEAVY → 10 (10 minutes total)

STEP 4 — WRITE THE CONTEXT MESSAGE
Write ONE sentence that:
- Acknowledges what the user JUST worked on specifically
- Explains WHY this specific type of rest matters for them
- Tone: calm, wise, like a smart friend who understands
- Do NOT mention Instagram, YouTube, or social media
- Do NOT use words: "alarming", "fry", "damage", "harm", "danger"
- Do USE words that feel like understanding, not warning
Examples:
- For LOGIC/HEAVY: "Your prefrontal cortex just ran a marathon — these 10 minutes let it actually consolidate what you built."
- For NARRATIVE/MODERATE: "The ideas you just processed need 7 quiet minutes to move from working memory into long-term storage."
- For EMOTIONAL/LIGHT: "Your nervous system flagged some stress today — 5 minutes of stillness resets your baseline faster than any distraction."
- For VISUAL/HEAVY: "Your visual cortex has been in overdrive — ambient rest without screens is the only thing that actually clears it."

STEP 5 — GENERATE THE 3-STEP RECOVERY PROTOCOL
Set step durations based on totalDuration:
- For 5 min (LIGHT): steps are "0–2 min", "2–4 min", "4–5 min"
- For 7 min (MODERATE): steps are "0–3 min", "3–5 min", "5–7 min"
- For 10 min (HEAVY): steps are "0–3 min", "3–7 min", "7–10 min"
Each step must be:
- Hyper-specific (not "rest" — say exactly what position, duration, activity)
- Include WHY it works for this specific fatigue type (one sentence, cite brain region)
- Include one thing to AVOID during this step and why it sets back recovery

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
  "contextMessage": "Single calm sentence acknowledging what they did",
  "totalDuration": 5|7|10,
  "steps": [
    {
      "duration": "0–X min",
      "action": "Extremely specific action with exact instructions",
      "why": "One sentence citing specific brain region and recovery mechanism",
      "avoid": "Specific thing to avoid and why it delays recovery"
    },
    {
      "duration": "X–Y min",
      "action": "Extremely specific action",
      "why": "One sentence neuroscience explanation",
      "avoid": "Specific avoidance with reason"
    },
    {
      "duration": "Y–Z min",
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
  } catch {
    return FALLBACK_PROTOCOL
  }
}