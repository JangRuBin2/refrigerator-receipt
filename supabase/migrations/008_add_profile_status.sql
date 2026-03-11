-- Add status column to profiles for soft-delete (account withdrawal)
-- status: 'active' (default), 'withdrawn'

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Withdrawn users should not pass RLS checks
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
