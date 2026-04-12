import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { anonymousUserId, authUserId, email } = await request.json()

    if (!anonymousUserId || !authUserId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('users')
      .update({ email, auth_user_id: authUserId })
      .eq('id', anonymousUserId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link user email error:', error)
    return NextResponse.json(
      { error: 'Failed to link user email' },
      { status: 500 }
    )
  }
}
