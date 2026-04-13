import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const { userId, firstName, digestEnabled } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    if (typeof firstName === 'string') {
      const trimmedName = firstName.trim()
      if (trimmedName) {
        updates.first_name = trimmedName
      }
    }

    if (typeof digestEnabled === 'boolean') {
      updates.digest_enabled = digestEnabled
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}