import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json().catch(() => ({}))
    const existingId = typeof body?.existingId === 'string' ? body.existingId : null

    if (existingId) {
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('id')
        .eq('id', existingId)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingUser?.id) {
        return NextResponse.json({ userId: existingUser.id })
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ email: null, auth_user_id: null })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ userId: data.id })
  } catch (error) {
    console.error('Anonymous user error:', error)
    return NextResponse.json(
      { error: 'Failed to create anonymous user' },
      { status: 500 }
    )
  }
}
