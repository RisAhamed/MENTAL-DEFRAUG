import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FatigueType, FeelingAfter, Intensity } from '@/types'

type InsightSession = {
  fatigue_type: FatigueType | null
  intensity: Intensity | null
  feeling_after: FeelingAfter | null
  created_at: string
}

const FATIGUE_TYPES: FatigueType[] = ['LOGIC', 'NARRATIVE', 'VISUAL', 'EMOTIONAL']
const FEELINGS: FeelingAfter[] = ['still_fried', 'bit_better', 'much_clearer']

function countValues<T extends string>(values: readonly T[], source: Array<T | null>) {
  return Object.fromEntries(values.map((value) => [value, source.filter((item) => item === value).length]))
}

function formatCounts(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([key, count]) => `${key}: ${count}`)
    .join(', ')
}

export async function POST(request: NextRequest) {
  try {
    const { userId, totalSessions } = await request.json()

    if (!userId || typeof totalSessions !== 'number') {
      return NextResponse.json({ insight: null })
    }

    if (totalSessions % 5 !== 0) {
      return NextResponse.json({ insight: null })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('sessions')
      .select('fatigue_type, intensity, feeling_after, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !data || data.length < 5) {
      return NextResponse.json({ insight: null })
    }

    const sessions = data as InsightSession[]
    const fatigueBreakdown = countValues(FATIGUE_TYPES, sessions.map((session) => session.fatigue_type))
    const feelingBreakdown = countValues(FEELINGS, sessions.map((session) => session.feeling_after))
    const heavyCount = sessions.filter((session) => session.intensity === 'HEAVY').length
    const sessionSummary = sessions
      .map((session, index) => {
        const feeling = session.feeling_after ?? 'not reported'
        return `${index + 1}. ${session.fatigue_type ?? 'UNKNOWN'} fatigue, ${session.intensity ?? 'UNKNOWN'} intensity, felt ${feeling}, at ${session.created_at}`
      })
      .join('\n')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ insight: null })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
      },
    })

    const prompt = `You are a cognitive performance coach analyzing a student's mental fatigue patterns.

Here is their last 5 study/work sessions:
${sessionSummary}

Fatigue breakdown: ${formatCounts(fatigueBreakdown)}
Heavy intensity sessions: ${heavyCount} out of 5
How they felt after defragging: ${formatCounts(feelingBreakdown)}

Write a surprise insight for this student. Rules:
- Maximum 2 sentences total
- Be hyper-specific to their actual pattern — reference their dominant fatigue type
- Be honest, not just encouraging — if they are overloading one type, say so
- Sound like a smart friend, not a wellness app
- Do NOT use generic phrases like "great job" or "keep it up"
- Start with "You've been..." or "Your brain has been..." or "Interesting —"

Return ONLY the insight text as a plain string. No JSON. No formatting.`

    const result = await model.generateContent(prompt)
    const insight = result.response.text().trim()

    return NextResponse.json({ insight: insight || null })
  } catch (error) {
    console.error('Generate insight error:', error)
    return NextResponse.json({ insight: null })
  }
}
