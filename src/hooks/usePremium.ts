'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SubscriptionResponse } from '@/types/subscription';

interface UsePremiumReturn {
  isPremium: boolean;
  isLoading: boolean;
  subscription: SubscriptionResponse | null;
  refetch: () => Promise<void>;
  checkPremiumAccess: (feature: PremiumFeature) => boolean;
}

export type PremiumFeature =
  | 'receipt_scan'
  | 'external_recipe_search'
  | 'ai_recipe'
  | 'nutrition_analysis'
  | 'smart_shopping'
  | 'waste_analysis'
  | 'no_ads';

// 환경변수로 프리미엄 체크 우회 설정
// 개발 환경에서만 NEXT_PUBLIC_BYPASS_PREMIUM=true 설정
const BYPASS_PREMIUM_CHECK = process.env.NEXT_PUBLIC_BYPASS_PREMIUM === 'true';

// 각 기능이 프리미엄 전용인지 정의
const PREMIUM_FEATURES: Record<PremiumFeature, boolean> = {
  receipt_scan: true,
  external_recipe_search: true,
  ai_recipe: true,
  nutrition_analysis: true,
  smart_shopping: true,
  waste_analysis: true,
  no_ads: true,
};

// 캐시 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

let cachedSubscription: SubscriptionResponse | null = null;
let cacheTimestamp: number | null = null;

export function usePremium(): UsePremiumReturn {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(cachedSubscription);
  const [isLoading, setIsLoading] = useState(!cachedSubscription && !BYPASS_PREMIUM_CHECK);

  const fetchSubscription = useCallback(async (force = false) => {
    // 프리미엄 체크 우회 시 API 호출 스킵
    if (BYPASS_PREMIUM_CHECK) {
      const premiumSub: SubscriptionResponse = { isPremium: true, plan: 'premium' };
      setSubscription(premiumSub);
      setIsLoading(false);
      return;
    }

    // 캐시가 유효한 경우 스킵
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
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data: SubscriptionResponse = await response.json();
        cachedSubscription = data;
        cacheTimestamp = Date.now();
        setSubscription(data);
      }
    } catch {
      // 실패 시 기본값
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
    // 프리미엄 체크 우회 시 모든 기능 접근 가능
    if (BYPASS_PREMIUM_CHECK) {
      return true;
    }
    // 프리미엄 기능이 아니면 항상 접근 가능
    if (!PREMIUM_FEATURES[feature]) {
      return true;
    }
    // 프리미엄 기능이면 구독 상태 확인
    return subscription?.isPremium ?? false;
  }, [subscription]);

  const refetch = useCallback(async () => {
    await fetchSubscription(true);
  }, [fetchSubscription]);

  return {
    // 프리미엄 체크 우회 시 항상 true
    isPremium: BYPASS_PREMIUM_CHECK ? true : (subscription?.isPremium ?? false),
    isLoading,
    subscription,
    refetch,
    checkPremiumAccess,
  };
}

// 캐시 초기화 (로그아웃 시 사용)
export function clearPremiumCache() {
  cachedSubscription = null;
  cacheTimestamp = null;
}
