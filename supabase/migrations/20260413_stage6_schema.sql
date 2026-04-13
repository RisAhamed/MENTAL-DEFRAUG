-- Add digest_enabled to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT true;

-- Add index for weekly email query performance
CREATE INDEX IF NOT EXISTS idx_users_email_digest 
ON public.users(email, digest_enabled) 
WHERE email IS NOT NULL;

-- Add index for sessions date query
CREATE INDEX IF NOT EXISTS idx_sessions_user_date 
ON public.sessions(user_id, created_at DESC);