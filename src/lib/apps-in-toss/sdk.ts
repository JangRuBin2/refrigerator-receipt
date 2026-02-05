// 앱인토스 SDK 클라이언트 래퍼
// 토스 앱 내 WebView 환경에서만 동작

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

  // 토스 앱 WebView User-Agent 확인
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('toss') || userAgent.includes('appintoss');
}

// 앱인토스 SDK 존재 여부 확인
function getAppsInTossSDK(): typeof window.AppsInToss | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { AppsInToss?: typeof window.AppsInToss }).AppsInToss ?? null;
}

// 상품 목록 조회
export async function getProductItemList(): Promise<IapProductItem[] | null> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.iap?.getProductItemList) {
    console.warn('[AppsInToss] SDK not available');
    return null;
  }

  try {
    const result = await sdk.iap.getProductItemList();
    return result?.products ?? [];
  } catch (error) {
    console.error('[AppsInToss] getProductItemList error:', error);
    return null;
  }
}

// 결제 요청
export async function createOneTimePurchaseOrder(
  sku: IapProductSku,
  onGrantProduct: () => Promise<boolean>
): Promise<IapPurchaseResult> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.iap?.createOneTimePurchaseOrder) {
    return {
      type: 'error',
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: 'AppsInToss SDK not available',
    };
  }

  try {
    const result = await sdk.iap.createOneTimePurchaseOrder({
      sku,
      onGrantProduct: async () => {
        // 파트너사 상품 지급 로직 실행
        const granted = await onGrantProduct();
        return granted;
      },
    });

    return result;
  } catch (error) {
    console.error('[AppsInToss] createOneTimePurchaseOrder error:', error);
    return {
      type: 'error',
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 미결 주문 조회 (SDK 1.2.2+)
export async function getPendingOrders(): Promise<IapPendingOrder[]> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.iap?.getPendingOrders) {
    return [];
  }

  try {
    const result = await sdk.iap.getPendingOrders();
    return result ?? [];
  } catch (error) {
    console.error('[AppsInToss] getPendingOrders error:', error);
    return [];
  }
}

// 상품 지급 완료 처리 (SDK 1.2.2+)
export async function completeProductGrant(orderId: string): Promise<boolean> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.iap?.completeProductGrant) {
    return false;
  }

  try {
    await sdk.iap.completeProductGrant({ orderId });
    return true;
  } catch (error) {
    console.error('[AppsInToss] completeProductGrant error:', error);
    return false;
  }
}

// 완료/환불된 주문 조회
export async function getCompletedOrRefundedOrders(): Promise<IapCompletedOrder[]> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.iap?.getCompletedOrRefundedOrders) {
    return [];
  }

  try {
    const result = await sdk.iap.getCompletedOrRefundedOrders();
    return result ?? [];
  } catch (error) {
    console.error('[AppsInToss] getCompletedOrRefundedOrders error:', error);
    return [];
  }
}

// 토스 로그인 userKey 가져오기
export async function getTossUserKey(): Promise<string | null> {
  const sdk = getAppsInTossSDK();
  if (!sdk?.auth?.getUserKey) {
    return null;
  }

  try {
    const userKey = await sdk.auth.getUserKey();
    return userKey ?? null;
  } catch (error) {
    console.error('[AppsInToss] getUserKey error:', error);
    return null;
  }
}

// TypeScript 전역 타입 선언
declare global {
  interface Window {
    AppsInToss?: {
      iap?: {
        getProductItemList: () => Promise<{ products: IapProductItem[] } | undefined>;
        createOneTimePurchaseOrder: (params: {
          sku: string;
          onGrantProduct: () => Promise<boolean>;
        }) => Promise<IapPurchaseResult>;
        getPendingOrders: () => Promise<IapPendingOrder[] | undefined>;
        completeProductGrant: (params: { orderId: string }) => Promise<void>;
        getCompletedOrRefundedOrders: () => Promise<IapCompletedOrder[] | undefined>;
      };
      auth?: {
        getUserKey: () => Promise<string | undefined>;
      };
    };
  }
}
