import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = createAdminClient()
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
