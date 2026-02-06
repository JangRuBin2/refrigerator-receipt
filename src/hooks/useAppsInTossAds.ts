'use client';

import { useState, useCallback } from 'react';
import { isAppsInTossEnvironment } from '@/lib/apps-in-toss/sdk';
import {
  loadAppsInTossAdMob,
  showAppsInTossAdMob,
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
  const isAvailable = typeof window !== 'undefined' && isAppsInTossEnvironment();

  // 보상형 광고 로드
  const loadRewardedAd = useCallback(async (
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<boolean> => {
    if (!isAvailable) return false;

    setAdState('loading');
    const result = await loadAppsInTossAdMob(adGroupId, 'rewarded');

    if (result.type === 'success') {
      setAdState('loaded');
      return true;
    }

    setAdState('error');
    return false;
  }, [isAvailable]);

  // 보상형 광고 표시
  const showRewardedAd = useCallback(async (
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<AdShowResult> => {
    if (!isAvailable) {
      return {
        type: 'error',
        adType: 'rewarded',
        errorCode: 'SDK_NOT_AVAILABLE',
        errorMessage: 'Not in AppsInToss environment',
      };
    }

    setAdState('showing');
    const result = await showAppsInTossAdMob(adGroupId, 'rewarded');

    setAdState('idle');
    return result;
  }, [isAvailable]);

  // 광고 시청 후 보상 지급 (편의 함수)
  const watchAdForReward = useCallback(async (
    onReward: () => void,
    adGroupId: AdGroupId = AD_GROUP_IDS.SCAN_REWARDED
  ): Promise<boolean> => {
    // 1. 광고 로드
    const loaded = await loadRewardedAd(adGroupId);
    if (!loaded) return false;

    // 2. 광고 표시
    const result = await showRewardedAd(adGroupId);

    // 3. 보상 지급
    if (result.type === 'success' && result.rewarded) {
      onReward();
      return true;
    }

    return false;
  }, [loadRewardedAd, showRewardedAd]);

  return {
    isAvailable,
    adState,
    loadRewardedAd,
    showRewardedAd,
    watchAdForReward,
  };
}
