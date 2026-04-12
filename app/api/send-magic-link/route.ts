import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isValidEmail(email: string) {
  const trimmedEmail = email.trim()
  const atIndex = trimmedEmail.indexOf('@')
  const dotAfterAtIndex = trimmedEmail.indexOf('.', atIndex + 1)
  return atIndex > 0 && dotAfterAtIndex > atIndex + 1 && dotAfterAtIndex < trimmedEmail.length - 1
}

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()
    const trimmedEmail = email.trim()

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { anonymousUserId: userId },
      },
    })

    if (error) throw error

    const response = NextResponse.json({ success: true })
    response.cookies.set('anon_user_id', userId, {
      httpOnly: true,
      maxAge: 60 * 30,
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
