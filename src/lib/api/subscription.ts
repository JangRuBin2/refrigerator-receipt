import { createClient } from '@/lib/supabase/client';
import type { SubscriptionResponse } from '@/types/subscription';

export async function getSubscription(): Promise<SubscriptionResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isPremium: false, plan: 'free' };
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !subscription) {
    return { isPremium: false, plan: 'free' };
  }

  const now = new Date();
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

  const isTrial = subscription.plan === 'trial';
  const isTrialActive = isTrial && expiresAt !== null && expiresAt > now;
  const isPremium = subscription.plan === 'premium' && (!expiresAt || expiresAt > now);

  const trialDaysRemaining = isTrial && expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : undefined;

  return {
    isPremium: isPremium || isTrialActive,
    plan: subscription.plan as 'free' | 'trial' | 'premium',
    billingCycle: subscription.billing_cycle,
    expiresAt: subscription.expires_at,
    autoRenew: subscription.auto_renew,
    isTrial,
    isTrialActive,
    trialDaysRemaining,
  };
}
