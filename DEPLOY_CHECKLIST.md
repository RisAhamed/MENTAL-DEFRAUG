# Deployment Checklist

## Before Deploying to Vercel

### Supabase Setup
- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Add your Vercel URL to "Site URL": https://your-app.vercel.app
- [ ] Add to "Redirect URLs": https://your-app.vercel.app/auth/callback
- [ ] Keep localhost:3000 in redirect URLs for local dev

### Environment Variables in Vercel Dashboard
Set ALL of these in Vercel → Project Settings → Environment Variables:
- [ ] NEXT_PUBLIC_SUPABASE_URL = (from Supabase project settings)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY = (from Supabase project settings)
- [ ] SUPABASE_SERVICE_ROLE_KEY = (from Supabase project settings → service_role key)
- [ ] GEMINI_API_KEY = (from Google AI Studio)
- [ ] RESEND_API_KEY = (from Resend dashboard — re-use your existing key)
- [ ] NEXT_PUBLIC_APP_URL = https://your-app.vercel.app (your actual Vercel URL)

### Row Level Security Verification
Run this in Supabase SQL Editor to verify RLS is working:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
Both users and sessions should show rowsecurity = true

### Test After Deploy
- [ ] Open production URL — input page loads
- [ ] Submit a session — Gemini API works in production
- [ ] Timer runs and completes
- [ ] Session appears in Supabase sessions table
- [ ] Magic link email arrives and auth callback works
- [ ] /landing page loads and CTA routes to /