// 앱인토스 SDK 클라이언트 래퍼
// SDK는 @apps-in-toss/web-framework에서 import
// 내부적으로 ReactNativeWebView.postMessage() 브릿지로 네이티브와 통신

import { appLogin } from '@apps-in-toss/web-framework';

import type {
  IapPurchaseResult,
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
  // Retry once on "signal is aborted" error (transient SDK bridge issue)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await appLogin();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 0 && msg.includes('abort')) {
        // Wait briefly and retry
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return null;
    }
  }
  return null;
}

// ── IAP Functions (Real SDK) ──────────────────────────────────

// IAP SDK는 dynamic import로 가져옴 (토스 환경에서만 사용 가능)
async function getIAP() {
  try {
    const { IAP } = await import('@apps-in-toss/web-framework');
    return IAP;
  } catch {
    return null;
  }
}

// 상품 목록 조회
export async function getProductItemList() {
  const IAP = await getIAP();
  if (!IAP) return null;

  try {
    const result = await IAP.getProductItemList();
    if (!result) return null;
    return result.products;
  } catch {
    return null;
  }
}

// 결제 요청 (event-based SDK를 Promise로 래핑)
export function createOneTimePurchaseOrder(
  sku: IapProductSku,
  onGrantProduct: (orderId: string) => Promise<boolean>
): Promise<IapPurchaseResult> {
  return new Promise(async (resolve) => {
    const IAP = await getIAP();
    if (!IAP) {
      resolve({
        type: 'error',
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'IAP SDK not available',
      });
      return;
    }

    try {
      IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: async ({ orderId }) => {
            // 서버에 구독 활성화 요청
            return onGrantProduct(orderId);
          },
        },
        onEvent: (event) => {
          resolve({
            type: 'success',
            orderId: event.data.orderId,
            sku,
          });
        },
        onError: (error) => {
          const err = error as { code?: string; message?: string };
          resolve({
            type: 'error',
            errorCode: (err.code as IapPurchaseResult['errorCode']) || 'UNKNOWN_ERROR',
            errorMessage: err.message || 'Purchase failed',
          });
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({
        type: 'error',
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: msg,
      });
    }
  });
}

// 미결 주문 조회
export async function getPendingOrders() {
  const IAP = await getIAP();
  if (!IAP) return [];

  try {
    const result = await IAP.getPendingOrders();
    if (!result) return [];
    return result.orders.map((order) => ({
      orderId: order.orderId,
      sku: order.sku,
      purchasedAt: order.paymentCompletedDate,
    }));
  } catch {
    return [];
  }
}

// 상품 지급 완료 처리
export async function completeProductGrant(orderId: string): Promise<boolean> {
  const IAP = await getIAP();
  if (!IAP) return false;

  try {
    const result = await IAP.completeProductGrant({ params: { orderId } });
    return result === true;
  } catch {
    return false;
  }
}

// 완료/환불된 주문 조회
export async function getCompletedOrRefundedOrders() {
  const IAP = await getIAP();
  if (!IAP) return [];

  try {
    const result = await IAP.getCompletedOrRefundedOrders();
    if (!result) return [];
    return result.orders.map((order) => ({
      orderId: order.orderId,
      sku: order.sku,
      status: order.status as 'COMPLETED' | 'REFUNDED',
      purchasedAt: order.date,
    }));
  } catch {
    return [];
  }
}
