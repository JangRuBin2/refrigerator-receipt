'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SubscriptionResponse } from '@/types/subscription';
import { getSubscription as getSubscriptionApi } from '@/lib/api/subscription';

interface UsePremiumReturn {
  isPremium: boolean;
  isLoading: boolean;
  subscription: SubscriptionResponse | null;
  refetch: () => Promise<void>;
  checkPremiumAccess: (feature: PremiumFeature) => boolean;
  isTrial: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
}

export type PremiumFeature =
  | 'receipt_scan'
  | 'external_recipe_search'
  | 'ai_recipe'
  | 'nutrition_analysis'
  | 'smart_shopping'
  | 'fridge_management'
  | 'recipe_browsing';

// 개발 환경에서만 NEXT_PUBLIC_BYPASS_PREMIUM=true 설정
const BYPASS_PREMIUM_CHECK = process.env.NEXT_PUBLIC_BYPASS_PREMIUM === 'true';

// 각 기능이 프리미엄 전용인지 정의
const PREMIUM_FEATURES: Record<PremiumFeature, boolean> = {
  receipt_scan: true,
  external_recipe_search: true,
  ai_recipe: true,
  nutrition_analysis: true,
  smart_shopping: true,
  fridge_management: true,
  recipe_browsing: true,
};

// 캐시 시간 (1분 - trial 만료 감지 개선)
const CACHE_DURATION = 1 * 60 * 1000;

let cachedSubscription: SubscriptionResponse | null = null;
let cacheTimestamp: number | null = null;

export function usePremium(): UsePremiumReturn {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(cachedSubscription);
  const [isLoading, setIsLoading] = useState(!cachedSubscription && !BYPASS_PREMIUM_CHECK);

  const fetchSubscription = useCallback(async (force = false) => {
    if (BYPASS_PREMIUM_CHECK) {
      const premiumSub: SubscriptionResponse = { isPremium: true, plan: 'premium' };
      setSubscription(premiumSub);
      setIsLoading(false);
      return;
    }

    if (!force && cachedSubscription && cacheTimestamp) {
      const now = Date.now();
      if (now - cacheTimestamp < CACHE_DURATION) {
        setSubscription(cachedSubscription);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const data = await getSubscriptionApi();
      cachedSubscription = data;
      cacheTimestamp = Date.now();
      setSubscription(data);
    } catch {
      const defaultSub: SubscriptionResponse = { isPremium: false, plan: 'free' };
      setSubscription(defaultSub);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const checkPremiumAccess = useCallback((feature: PremiumFeature): boolean => {
    if (BYPASS_PREMIUM_CHECK) {
      return true;
    }
    if (!PREMIUM_FEATURES[feature]) {
      return true;
    }
    return subscription?.isPremium ?? false;
  }, [subscription]);

  const refetch = useCallback(async () => {
    await fetchSubscription(true);
  }, [fetchSubscription]);

  const isTrial = subscription?.isTrial ?? false;
  const isTrialActive = subscription?.isTrialActive ?? false;
  const isTrialExpired = isTrial && !isTrialActive;
  const trialDaysRemaining = subscription?.trialDaysRemaining ?? 0;

  return {
    isPremium: BYPASS_PREMIUM_CHECK ? true : (subscription?.isPremium ?? false),
    isLoading,
    subscription,
    refetch,
    checkPremiumAccess,
    isTrial,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
  };
}

// 캐시 초기화 (로그아웃 시 사용)
export function clearPremiumCache() {
  cachedSubscription = null;
  cacheTimestamp = null;
}
