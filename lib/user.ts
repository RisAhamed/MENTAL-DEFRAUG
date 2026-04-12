const USER_ID_KEY = 'mental_defrag_user_id'

export async function getOrCreateAnonymousUser(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Cannot call from server')

  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const response = await fetch('/api/anonymous-user', { method: 'POST' })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.userId) {
    throw new Error(data?.error || 'Failed to create anonymous user')
  }

  localStorage.setItem(USER_ID_KEY, data.userId)
  return data.userId
}

export async function getUserStats(userId: string) {
  const response = await fetch(`/api/user-stats?userId=${encodeURIComponent(userId)}`)
  const data = await response.json().catch(() => null)
  return response.ok ? data?.stats : null
}

export async function getUserSessionCount(userId: string): Promise<number> {
  const response = await fetch(`/api/user-stats?userId=${encodeURIComponent(userId)}`)
  const data = await response.json().catch(() => null)
  return response.ok ? data?.sessionCount ?? 0 : 0
}

export async function linkUserToEmail(
  anonymousUserId: string,
  authUserId: string,
  email: string
) {
  const response = await fetch('/api/link-user-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymousUserId, authUserId, email }),
  })

  if (!response.ok) {
    throw new Error('Failed to link user email')
  }
}
