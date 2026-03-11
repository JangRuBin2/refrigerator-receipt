// 앱인토스 광고 SDK 타입 정의
// https://developers-apps-in-toss.toss.im/ads/develop.html

// 광고 타입
export type AdType = 'interstitial' | 'rewarded';

// 광고 로드 결과 (our wrapper result)
export interface AdLoadResult {
  type: 'success' | 'error';
  adType: AdType;
  errorCode?: AdErrorCode;
  errorMessage?: string;
}

// 광고 표시 결과 (our wrapper result)
export interface AdShowResult {
  type: 'success' | 'error' | 'canceled';
  adType: AdType;
  rewarded?: boolean; // 보상형 광고의 경우 보상 지급 여부
  errorCode?: AdErrorCode;
  errorMessage?: string;
}

// 광고 에러 코드
export type AdErrorCode =
  | 'AD_NOT_LOADED'
  | 'AD_ALREADY_SHOWING'
  | 'AD_LOAD_FAILED'
  | 'AD_SHOW_FAILED'
  | 'USER_CANCELED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SDK_NOT_AVAILABLE'
  | 'UNKNOWN_ERROR';

// 광고 상태
export type AdState = 'idle' | 'loading' | 'loaded' | 'showing' | 'error';

// 환경 판별: 프로덕션은 Vercel 배포 또는 토스 WebView
const isProduction = typeof window !== 'undefined' && (
  window.location.hostname === 'refrigerator-receipt.vercel.app' ||
  window.location.hostname.includes('tossmini.com') ||
  process.env.NODE_ENV === 'production'
);

// 보상형/전면형 광고 ID (환경별 자동 분리)
export const AD_GROUP_IDS = {
  SCAN_REWARDED: isProduction
    ? 'ait.v2.live.a6680c6229624182'
    : 'ait-ad-test-rewarded-id',
  INTERSTITIAL: isProduction
    ? 'ait-ad-test-interstitial-id' // 프로덕션 ID 미발급 → 테스트 유지
    : 'ait-ad-test-interstitial-id',
} as const;

export type AdGroupId = string;

// 배너 광고 ID (환경별 자동 분리)
export const BANNER_AD_IDS = {
  HOME_BANNER: isProduction
    ? 'ait.v2.live.9c28c530c14a4b96'
    : 'ait-ad-test-banner-id',
} as const;

export type BannerAdId = string;
