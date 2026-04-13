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
  contextMessage: string
  totalDuration: number
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