import { SupabaseClient } from '@supabase/supabase-js';

// 무료 체험 횟수 설정
export const FREE_TRIAL_LIMITS: Record<string, number> = {
  external_recipe_search: 3,
  ai_recipe_generate: 3,
};

export type FreeTrialFeature = keyof typeof FREE_TRIAL_LIMITS;

interface FreeTrialResult {
  canUse: boolean;
  usedCount: number;
  remainingCount: number;
  limit: number;
}

/**
 * 무료 체험 사용 가능 여부 확인
 */
export async function checkFreeTrial(
  supabase: SupabaseClient,
  userId: string,
  feature: FreeTrialFeature
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

/**
 * 프리미엄 상태 확인 (trial 포함)
 */
export async function checkPremiumStatus(
  supabase: SupabaseClient,
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

  if (subscription.plan === 'premium') {
    return !expiresAt || expiresAt > now;
  }

  if (subscription.plan === 'trial') {
    return expiresAt !== null && expiresAt > now;
  }

  return false;
}

/**
 * 프리미엄 또는 무료 체험 사용 가능 여부 확인
 */
export async function checkAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: FreeTrialFeature
): Promise<{
  hasAccess: boolean;
  isPremium: boolean;
  freeTrial: FreeTrialResult;
}> {
  const isPremium = await checkPremiumStatus(supabase, userId);

  if (isPremium) {
    return {
      hasAccess: true,
      isPremium: true,
      freeTrial: {
        canUse: true,
        usedCount: 0,
        remainingCount: FREE_TRIAL_LIMITS[feature],
        limit: FREE_TRIAL_LIMITS[feature],
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
