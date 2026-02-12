// 앱인토스 인앱결제 타입 정의
// https://developers-apps-in-toss.toss.im/iap/develop.html

export interface IapProductItem {
  sku: string;
  displayAmount: string;
  displayName: string;
  iconUrl?: string;
  description?: string;
}

export interface IapProductListResponse {
  products: IapProductItem[];
}

export interface IapPurchaseResult {
  type: 'success' | 'error';
  orderId?: string;
  sku?: string;
  errorCode?: IapErrorCode;
  errorMessage?: string;
}

export type IapErrorCode =
  | 'USER_CANCELED'
  | 'NETWORK_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'ALREADY_PURCHASED'
  | 'PAYMENT_FAILED'
  | 'PRODUCT_NOT_GRANTED_BY_PARTNER'
  | 'UNKNOWN_ERROR';

export interface IapPendingOrder {
  orderId: string;
  sku: string;
  purchasedAt: string;
}

export interface IapCompletedOrder {
  orderId: string;
  sku: string;
  status: 'COMPLETED' | 'REFUNDED';
  purchasedAt: string;
  completedAt?: string;
  refundedAt?: string;
}

// 서버 API 응답 타입
export type IapOrderStatus =
  | 'PURCHASED'
  | 'PAYMENT_COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'ORDER_IN_PROGRESS'
  | 'NOT_FOUND';

export interface IapOrderStatusResponse {
  orderId: string;
  status: IapOrderStatus;
  sku?: string;
  amount?: number;
  purchasedAt?: string;
}

// 상품 SKU 상수 (토스 콘솔 상품 ID와 일치해야 함)
export const IAP_PRODUCTS = {
  PREMIUM_MONTHLY: 'ait.00000019137.0663824b.b20f0d783f.0903882326',
  PREMIUM_YEARLY: 'ait.0000019137.6f6a37f6.828a06d1ea.0905836508',
} as const;

export type IapProductSku = typeof IAP_PRODUCTS[keyof typeof IAP_PRODUCTS];

// 토스 연결 끊기 콜백 타입
export interface TossDisconnectRequest {
  userKey: number;
  referrer: 'UNLINK';
}
