-- Add trial plan support to subscriptions table
-- Run this in Supabase SQL Editor

-- Update plan check constraint to include 'trial'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'trial', 'premium'));

-- Add trial_started_at column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Create 'free' subscription for existing users who don't have one
-- These users get no trial (they were already using the app)
INSERT INTO public.subscriptions (user_id, plan, created_at, updated_at)
SELECT p.id, 'free', NOW(), NOW()
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
