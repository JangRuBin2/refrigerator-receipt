// 앱인토스 광고 SDK 클라이언트 래퍼
// GoogleAdMob SDK는 이벤트 콜백 기반 → Promise로 래핑

import { GoogleAdMob } from '@apps-in-toss/web-framework';

import type {
  AdLoadResult,
  AdShowResult,
} from '@/types/apps-in-toss-ads';

// GoogleAdMob 광고 지원 여부 확인
export function isAdMobSupported(): boolean {
  try {
    return GoogleAdMob.loadAppsInTossAdMob.isSupported() === true;
  } catch {
    return false;
  }
}

// 보상형 광고 로드 (event-based → Promise 래핑)
export function loadRewardedAd(adGroupId: string): Promise<AdLoadResult> {
  return new Promise((resolve) => {
    try {
      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            resolve({ type: 'success', adType: 'rewarded' });
          }
        },
        onError: (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          resolve({
            type: 'error',
            adType: 'rewarded',
            errorCode: 'AD_LOAD_FAILED',
            errorMessage: msg,
          });
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      resolve({
        type: 'error',
        adType: 'rewarded',
        errorCode: 'SDK_NOT_AVAILABLE',
        errorMessage: msg,
      });
    }
  });
}

// 보상형 광고 표시 (event-based → Promise 래핑, userEarnedReward 감지)
export function showRewardedAd(adGroupId: string): Promise<AdShowResult> {
  return new Promise((resolve) => {
    let rewarded = false;
    let resolved = false;

    const safeResolve = (result: AdShowResult) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    try {
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') {
            rewarded = true;
          }
          if (event.type === 'dismissed') {
            safeResolve({
              type: 'success',
              adType: 'rewarded',
              rewarded,
            });
          }
          if (event.type === 'failedToShow') {
            safeResolve({
              type: 'error',
              adType: 'rewarded',
              errorCode: 'AD_SHOW_FAILED',
              errorMessage: 'Ad failed to show',
            });
          }
        },
        onError: (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          safeResolve({
            type: 'error',
            adType: 'rewarded',
            errorCode: 'AD_SHOW_FAILED',
            errorMessage: msg,
          });
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      safeResolve({
        type: 'error',
        adType: 'rewarded',
        errorCode: 'SDK_NOT_AVAILABLE',
        errorMessage: msg,
      });
    }
  });
}

// 광고 로드 및 표시 (편의 함수)
export async function loadAndShowRewardedAd(
  adGroupId: string
): Promise<AdShowResult> {
  const loadResult = await loadRewardedAd(adGroupId);
  if (loadResult.type === 'error') {
    return {
      type: 'error',
      adType: 'rewarded',
      errorCode: loadResult.errorCode,
      errorMessage: loadResult.errorMessage,
    };
  }

  return showRewardedAd(adGroupId);
}
