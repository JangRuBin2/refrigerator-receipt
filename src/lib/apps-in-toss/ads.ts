// 앱인토스 광고 SDK 클라이언트 래퍼
// GoogleAdMob SDK는 이벤트 콜백 기반 → Promise로 래핑

import { GoogleAdMob, TossAds } from '@apps-in-toss/web-framework';

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

// 보상형 광고 로드 (event-based → Promise 래핑, 타임아웃 포함)
export function loadRewardedAd(adGroupId: string, timeout = 10000): Promise<AdLoadResult> {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (result: AdLoadResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      safeResolve({
        type: 'error',
        adType: 'rewarded',
        errorCode: 'TIMEOUT',
        errorMessage: `Ad load timed out after ${timeout}ms`,
      });
    }, timeout);

    try {
      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            safeResolve({ type: 'success', adType: 'rewarded' });
          }
        },
        onError: (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          safeResolve({
            type: 'error',
            adType: 'rewarded',
            errorCode: 'AD_LOAD_FAILED',
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

// --- TossAds 배너 광고 ---

// TossAds 배너 지원 여부 확인
export function isTossAdsBannerSupported(): boolean {
  try {
    return TossAds.attach.isSupported() === true;
  } catch {
    return false;
  }
}

// TossAds SDK 초기화
export function initializeTossAds(): void {
  try {
    if (TossAds.initialize.isSupported()) {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            // SDK initialized
          },
          onInitializationFailed: () => {
            // initialization failed
          },
        },
      });
    }
  } catch {
    // SDK not available
  }
}

// 배너 광고를 DOM 요소에 부착
export function attachBannerAd(
  adGroupId: string,
  target: HTMLElement,
  options?: {
    theme?: 'light' | 'dark';
    tone?: 'blackAndWhite' | 'grey';
    variant?: 'expanded' | 'card';
    padding?: string;
    onRendered?: () => void;
    onFailed?: () => void;
  }
): (() => void) | null {
  try {
    if (!TossAds.attach.isSupported()) return null;

    TossAds.attach(adGroupId, target, {
      theme: options?.theme,
      padding: options?.padding,
      callbacks: {
        onAdRendered: () => options?.onRendered?.(),
        onAdFailedToRender: () => options?.onFailed?.(),
      },
    });

    // 클린업 함수 반환
    return () => {
      try {
        TossAds.destroyAll();
      } catch {
        // ignore cleanup errors
      }
    };
  } catch {
    return null;
  }
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
