import { createClient } from '@/lib/supabase/client'

const USER_ID_KEY = 'mental_defrag_user_id'

export async function getOrCreateAnonymousUser(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Cannot call from server')

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

export async function getUserStats(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('total_points, current_streak, longest_streak, last_defrag_date, badges, email')
    .eq('id', userId)
    .single()
  return data
}

export async function getUserSessionCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

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