-- Add demographic fields to profiles for personalized nutrition analysis
-- Gender and birth_date can come from Toss OAuth or manual user input

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS toss_user_key TEXT;

-- Index for toss_user_key lookup (used during auth)
CREATE INDEX IF NOT EXISTS idx_profiles_toss_user_key ON public.profiles(toss_user_key);
