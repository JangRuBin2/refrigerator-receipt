// 앱인토스 SDK 클라이언트 래퍼
// SDK는 @apps-in-toss/web-framework에서 import
// 내부적으로 ReactNativeWebView.postMessage() 브릿지로 네이티브와 통신

import { appLogin, checkoutPayment } from '@apps-in-toss/web-framework';

import type {
  IapProductItem,
  IapPurchaseResult,
  IapPendingOrder,
  IapCompletedOrder,
  IapProductSku,
} from '@/types/apps-in-toss';

// 앱인토스 환경 감지
export function isAppsInTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('toss') || userAgent.includes('appintoss');
}

// 토스 로그인 (OAuth2 인가코드 획득)
export async function tossAppLogin(): Promise<{
  authorizationCode: string;
  referrer: string;
} | null> {
  try {
    const result = await appLogin();
    return result;
  } catch {
    return null;
  }
}

// IAP functions use checkoutPayment bridge
// TODO: Migrate IAP to use proper SDK imports when needed

// 상품 목록 조회 (placeholder - needs proper SDK function)
export async function getProductItemList(): Promise<IapProductItem[] | null> {
  return null;
}

// 결제 요청 (placeholder - needs proper SDK function)
export async function createOneTimePurchaseOrder(
  _sku: IapProductSku,
  _onGrantProduct: () => Promise<boolean>
): Promise<IapPurchaseResult> {
  return {
    type: 'error',
    errorCode: 'UNKNOWN_ERROR',
    errorMessage: 'IAP not yet migrated to new SDK',
  };
}

// 미결 주문 조회 (placeholder)
export async function getPendingOrders(): Promise<IapPendingOrder[]> {
  return [];
}

// 상품 지급 완료 처리 (placeholder)
export async function completeProductGrant(_orderId: string): Promise<boolean> {
  return false;
}

// 완료/환불된 주문 조회 (placeholder)
export async function getCompletedOrRefundedOrders(): Promise<IapCompletedOrder[]> {
  return [];
}
