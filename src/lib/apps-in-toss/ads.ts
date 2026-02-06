// 앱인토스 광고 SDK 클라이언트 래퍼
// 토스 앱 내 WebView 환경에서만 동작

import type {
  AdType,
  AdLoadResult,
  AdShowResult,
  AdGroupId,
} from '@/types/apps-in-toss-ads';
import { isAppsInTossEnvironment } from './sdk';

// 앱인토스 광고 SDK 존재 여부 확인
function getAppsInTossAdsSDK(): AppsInTossAdsSDK | null {
  if (typeof window === 'undefined') return null;
  const win = window as WindowWithAppsInTossAds;
  return win.AppsInToss?.ads ?? null;
}

// 광고 로드
export async function loadAppsInTossAdMob(
  adGroupId: AdGroupId,
  adType: AdType
): Promise<AdLoadResult> {
  if (!isAppsInTossEnvironment()) {
    return {
      type: 'error',
      adType,
      errorCode: 'SDK_NOT_AVAILABLE',
      errorMessage: 'Not in AppsInToss environment',
    };
  }

  const sdk = getAppsInTossAdsSDK();
  if (!sdk?.loadAppsInTossAdMob) {
    return {
      type: 'error',
      adType,
      errorCode: 'SDK_NOT_AVAILABLE',
      errorMessage: 'AppsInToss Ads SDK not available',
    };
  }

  try {
    const result = await sdk.loadAppsInTossAdMob({
      adGroupId,
      adType,
    });

    if (result?.success) {
      return { type: 'success', adType };
    }

    return {
      type: 'error',
      adType,
      errorCode: 'AD_LOAD_FAILED',
      errorMessage: result?.errorMessage || 'Failed to load ad',
    };
  } catch (error) {
    console.error('[AppsInToss Ads] loadAppsInTossAdMob error:', error);
    return {
      type: 'error',
      adType,
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 광고 표시
export async function showAppsInTossAdMob(
  adGroupId: AdGroupId,
  adType: AdType
): Promise<AdShowResult> {
  if (!isAppsInTossEnvironment()) {
    return {
      type: 'error',
      adType,
      errorCode: 'SDK_NOT_AVAILABLE',
      errorMessage: 'Not in AppsInToss environment',
    };
  }

  const sdk = getAppsInTossAdsSDK();
  if (!sdk?.showAppsInTossAdMob) {
    return {
      type: 'error',
      adType,
      errorCode: 'SDK_NOT_AVAILABLE',
      errorMessage: 'AppsInToss Ads SDK not available',
    };
  }

  try {
    const result = await sdk.showAppsInTossAdMob({
      adGroupId,
      adType,
    });

    if (result?.success) {
      return {
        type: 'success',
        adType,
        rewarded: adType === 'rewarded' ? result.rewarded : undefined,
      };
    }

    if (result?.canceled) {
      return {
        type: 'canceled',
        adType,
        rewarded: false,
      };
    }

    return {
      type: 'error',
      adType,
      errorCode: 'AD_SHOW_FAILED',
      errorMessage: result?.errorMessage || 'Failed to show ad',
    };
  } catch (error) {
    console.error('[AppsInToss Ads] showAppsInTossAdMob error:', error);
    return {
      type: 'error',
      adType,
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 광고 로드 및 표시 (편의 함수)
export async function loadAndShowRewardedAd(
  adGroupId: AdGroupId
): Promise<AdShowResult> {
  // 1. 광고 로드
  const loadResult = await loadAppsInTossAdMob(adGroupId, 'rewarded');
  if (loadResult.type === 'error') {
    return {
      type: 'error',
      adType: 'rewarded',
      errorCode: loadResult.errorCode,
      errorMessage: loadResult.errorMessage,
    };
  }

  // 2. 광고 표시
  return showAppsInTossAdMob(adGroupId, 'rewarded');
}

// TypeScript 타입 정의
interface AppsInTossAdsSDK {
  loadAppsInTossAdMob?: (params: {
    adGroupId: string;
    adType: AdType;
  }) => Promise<{ success: boolean; errorMessage?: string } | undefined>;

  showAppsInTossAdMob?: (params: {
    adGroupId: string;
    adType: AdType;
  }) => Promise<{
    success: boolean;
    canceled?: boolean;
    rewarded?: boolean;
    errorMessage?: string;
  } | undefined>;
}

interface WindowWithAppsInTossAds {
  AppsInToss?: {
    ads?: AppsInTossAdsSDK;
  };
}
