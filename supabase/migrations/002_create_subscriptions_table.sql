-- Create subscriptions table for Apps in Toss IAP
-- Run this in Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,

    -- Apps in Toss specific fields
    toss_order_id TEXT,
    toss_user_key TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint on user_id
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_toss_order_id ON public.subscriptions(toss_order_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
    ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add comment
COMMENT ON TABLE public.subscriptions IS 'User subscription information for Apps in Toss IAP';
