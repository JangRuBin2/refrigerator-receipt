import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FREE_TRIAL_LIMITS: Record<string, number> = {
  external_recipe_search: 3,
  ai_recipe_generate: 3,
};

interface FreeTrialResult {
  canUse: boolean;
  usedCount: number;
  remainingCount: number;
  limit: number;
}

export async function checkFreeTrial(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  feature: string
): Promise<FreeTrialResult> {
  const limit = FREE_TRIAL_LIMITS[feature] || 3;

  const { count } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', feature);

  const usedCount = count || 0;
  const remainingCount = Math.max(0, limit - usedCount);

  return {
    canUse: usedCount < limit,
    usedCount,
    remainingCount,
    limit,
  };
}

export async function checkPremiumStatus(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .single();

  if (!subscription) return false;

  const now = new Date();
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

  return subscription.plan === 'premium' && (!expiresAt || expiresAt > now);
}

export async function checkAccess(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  feature: string
): Promise<{
  hasAccess: boolean;
  isPremium: boolean;
  freeTrial: FreeTrialResult;
}> {
  const isPremium = await checkPremiumStatus(supabase, userId);

  if (isPremium) {
    const limit = FREE_TRIAL_LIMITS[feature] || 3;
    return {
      hasAccess: true,
      isPremium: true,
      freeTrial: {
        canUse: true,
        usedCount: 0,
        remainingCount: limit,
        limit,
      },
    };
  }

  const freeTrial = await checkFreeTrial(supabase, userId, feature);

  return {
    hasAccess: freeTrial.canUse,
    isPremium: false,
    freeTrial,
  };
}
