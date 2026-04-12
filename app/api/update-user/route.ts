import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const { userId, firstName } = await request.json()

    if (!userId || typeof firstName !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trimmedName = firstName.trim()
    if (!trimmedName) {
      return NextResponse.json({ error: 'Missing first name' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('users')
      .update({ first_name: trimmedName })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
