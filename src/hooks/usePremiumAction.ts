'use client';

import { useState, useCallback } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { useAppsInTossAds } from '@/hooks/useAppsInTossAds';

interface UsePremiumActionReturn {
  executeWithPremiumCheck: (action: () => Promise<void> | void) => Promise<void>;
  showPremiumModal: boolean;
  closePremiumModal: () => void;
  isWatchingAd: boolean;
}

export function usePremiumAction(): UsePremiumActionReturn {
  const { isPremium } = usePremium();
  const { isAvailable: isAdsAvailable, watchAdForReward } = useAppsInTossAds();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const executeWithPremiumCheck = useCallback(async (action: () => Promise<void> | void) => {
    // 프리미엄 사용자 → 즉시 실행
    if (isPremium) {
      await action();
      return;
    }

    // 광고 가능 → 시청 후 실행
    if (isAdsAvailable) {
      setIsWatchingAd(true);
      try {
        const rewarded = await watchAdForReward(() => {});
        if (rewarded) {
          await action();
        } else {
          // 광고 실패/스킵 → PremiumModal
          setShowPremiumModal(true);
        }
      } finally {
        setIsWatchingAd(false);
      }
      return;
    }

    // 광고 불가 → PremiumModal
    setShowPremiumModal(true);
  }, [isPremium, isAdsAvailable, watchAdForReward]);

  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

  return {
    executeWithPremiumCheck,
    showPremiumModal,
    closePremiumModal,
    isWatchingAd,
  };
}
