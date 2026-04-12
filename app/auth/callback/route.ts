import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get('code')
  const anonymousUserId = request.cookies.get('anonymous_user_id')?.value

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Link anonymous user to email if we have the ID
      if (anonymousUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const admin = createAdminClient()
          await admin
            .from('users')
            .update({ email: user.email, auth_user_id: user.id })
            .eq('id', anonymousUserId)
        }
      }

      const response = NextResponse.redirect(`${origin}/done?linked=true`)
      response.cookies.delete('anonymous_user_id')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
