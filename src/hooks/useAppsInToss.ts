'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isAppsInTossEnvironment,
  getProductItemList,
  createOneTimePurchaseOrder,
  getPendingOrders,
  completeProductGrant,
} from '@/lib/apps-in-toss/sdk';
import { iapActivate } from '@/lib/api/auth';
import type {
  IapProductItem,
  IapPurchaseResult,
  IapPendingOrder,
  IapProductSku,
} from '@/types/apps-in-toss';

interface UseAppsInTossReturn {
  isAvailable: boolean;
  isLoading: boolean;
  products: IapProductItem[];
  pendingOrders: IapPendingOrder[];
  purchase: (sku: IapProductSku) => Promise<IapPurchaseResult>;
  restorePendingOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
}

export function useAppsInToss(): UseAppsInTossReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<IapProductItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<IapPendingOrder[]>([]);

  // 초기화
  useEffect(() => {
    async function init() {
      const available = isAppsInTossEnvironment();
      setIsAvailable(available);

      if (available) {
        const productList = await getProductItemList();
        if (productList) {
          setProducts(productList);
        }
      }

      setIsLoading(false);
    }

    init();
  }, []);

  // 상품 목록 새로고침
  const refreshProducts = useCallback(async () => {
    if (!isAvailable) return;

    const productList = await getProductItemList();
    if (productList) {
      setProducts(productList);
    }
  }, [isAvailable]);

  // 결제 요청
  const purchase = useCallback(async (sku: IapProductSku): Promise<IapPurchaseResult> => {
    if (!isAvailable) {
      return {
        type: 'error',
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'AppsInToss not available',
      };
    }

    // createOneTimePurchaseOrder에 processProductGrant 콜백 전달
    // SDK가 결제 성공 후 이 콜백을 orderId와 함께 호출
    const result = await createOneTimePurchaseOrder(sku, async (orderId) => {
      try {
        const data = await iapActivate({ orderId, sku, tossUserKey: null });
        return data.success;
      } catch {
        return false;
      }
    });

    return result;
  }, [isAvailable]);

  // 미결 주문 복원
  const restorePendingOrders = useCallback(async () => {
    if (!isAvailable) return;

    const orders = await getPendingOrders();
    setPendingOrders(orders);

    // 미결 주문이 있으면 상품 지급 처리
    for (const order of orders) {
      try {
        const data = await iapActivate({
          orderId: order.orderId,
          sku: order.sku,
          tossUserKey: null,
        });

        if (data.success) {
          // 지급 완료 처리
          await completeProductGrant(order.orderId);
        }
      } catch {
        // Failed to restore order - continue with next
      }
    }

    // 다시 조회하여 상태 업데이트
    const updatedOrders = await getPendingOrders();
    setPendingOrders(updatedOrders);
  }, [isAvailable]);

  return {
    isAvailable,
    isLoading,
    products,
    pendingOrders,
    purchase,
    restorePendingOrders,
    refreshProducts,
  };
}
