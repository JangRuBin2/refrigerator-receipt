// 앱인토스 광고 SDK 타입 정의
// https://developers-apps-in-toss.toss.im/ads/develop.html

// 광고 타입
export type AdType = 'interstitial' | 'rewarded';

// 광고 로드 결과
export interface AdLoadResult {
  type: 'success' | 'error';
  adType: AdType;
  errorCode?: AdErrorCode;
  errorMessage?: string;
}

// 광고 표시 결과
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
  | 'SDK_NOT_AVAILABLE'
  | 'UNKNOWN_ERROR';

// 광고 상태
export type AdState = 'idle' | 'loading' | 'loaded' | 'showing' | 'error';

// 광고 그룹 ID 상수
export const AD_GROUP_IDS = {
  // 테스트용 ID (개발 중에만 사용)
  TEST_INTERSTITIAL: 'ait-ad-test-interstitial-id',
  TEST_REWARDED: 'ait-ad-test-rewarded-id',

  // 실제 광고 ID (환경변수에서 로드)
  SCAN_REWARDED: process.env.NEXT_PUBLIC_TOSS_AD_SCAN_REWARDED || 'ait-ad-test-rewarded-id',
} as const;

export type AdGroupId = typeof AD_GROUP_IDS[keyof typeof AD_GROUP_IDS];
