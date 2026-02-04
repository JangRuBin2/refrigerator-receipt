-- Add premium columns to profiles table
-- Run this in Supabase SQL Editor

-- Add is_premium column with default false
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add subscription_end_date column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Create index for premium queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium);
