import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const anonymousUserId = request.cookies.get('anon_user_id')?.value
  const response = NextResponse.redirect(`${origin}/done?linked=true`)

  if (anonymousUserId && session.user.email) {
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('users')
      .update({ email: session.user.email, auth_user_id: session.user.id })
      .eq('id', anonymousUserId)

    if (updateError) {
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }

    response.cookies.delete('anon_user_id')
  }

  return response
}
