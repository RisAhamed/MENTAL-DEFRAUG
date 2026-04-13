import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete all sessions for this user
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[RESET] Delete sessions error:', deleteError)
      // Continue even if delete fails
    }

    // Reset user stats
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        badges: [],
        last_defrag_date: null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[RESET] Update user error:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to reset user data' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[RESET] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}