'use client';

import { useState, useCallback } from 'react';
import {
  isAdMobSupported,
  loadRewardedAd,
  showRewardedAd,
} from '@/lib/apps-in-toss/ads';
import type { AdState, AdShowResult, AdGroupId } from '@/types/apps-in-toss-ads';
import { AD_GROUP_IDS } from '@/types/apps-in-toss-ads';

interface UseAppsInTossAdsReturn {
  isAvailable: boolean;
  adState: AdState;
  loadRewardedAd: (adGroupId?: AdGroupId) => Promise<boolean>;
  showRewardedAd: (adGroupId?: AdGroupId) => Promise<AdShowResult>;
  watchAdForReward: (onReward: () => void, adGroupId?: AdGroupId) => Promise<boolean>;
}

export function useAppsInTossAds(): UseAppsInTossAdsReturn {
  const [adState, setAdState] = useState<AdState>('idle');
  const isAvailable = typeof window !== 'undefined' && isAdMobSupported();

  // 보상형 광고 로드
  const handleLoadRewardedAd = useCallback(async (
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<boolean> => {
    if (!isAvailable) return false;

    setAdState('loading');
    const result = await loadRewardedAd(adGroupId);

    if (result.type === 'success') {
      setAdState('loaded');
      return true;
    }

    setAdState('error');
    return false;
  }, [isAvailable]);

  // 보상형 광고 표시
  const handleShowRewardedAd = useCallback(async (
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<AdShowResult> => {
    if (!isAvailable) {
      return {
        type: 'error',
        adType: 'rewarded',
        errorCode: 'SDK_NOT_AVAILABLE',
        errorMessage: 'AdMob not supported in this environment',
      };
    }

    setAdState('showing');
    const result = await showRewardedAd(adGroupId);

    setAdState('idle');
    return result;
  }, [isAvailable]);

  // 광고 시청 후 보상 지급 (편의 함수)
  const watchAdForReward = useCallback(async (
    onReward: () => void,
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<boolean> => {
    // 1. 광고 로드
    const loaded = await handleLoadRewardedAd(adGroupId);
    if (!loaded) return false;

    // 2. 광고 표시
    const result = await handleShowRewardedAd(adGroupId);

    // 3. 보상 지급
    if (result.type === 'success' && result.rewarded) {
      onReward();
      return true;
    }

    return false;
  }, [handleLoadRewardedAd, handleShowRewardedAd]);

  return {
    isAvailable,
    adState,
    loadRewardedAd: handleLoadRewardedAd,
    showRewardedAd: handleShowRewardedAd,
    watchAdForReward,
  };
}
