// 앱인토스 서버 API 클라이언트 (mTLS 인증)
// https://developers-apps-in-toss.toss.im/development/integration-process.html

import https from 'https';
import type { IapOrderStatusResponse } from '@/types/apps-in-toss';

const APPS_IN_TOSS_API_URL = process.env.APPS_IN_TOSS_API_URL || 'https://api.apps-in-toss.toss.im';

// mTLS 인증서 로드
function getMtlsAgent(): https.Agent | null {
  const certBase64 = process.env.APPS_IN_TOSS_MTLS_CERT;
  const keyBase64 = process.env.APPS_IN_TOSS_MTLS_KEY;

  if (!certBase64 || !keyBase64) {
    console.warn('[AppsInToss] mTLS credentials not configured');
    return null;
  }

  try {
    const cert = Buffer.from(certBase64, 'base64').toString('utf-8');
    const key = Buffer.from(keyBase64, 'base64').toString('utf-8');

    return new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });
  } catch (error) {
    console.error('[AppsInToss] Failed to load mTLS credentials:', error);
    return null;
  }
}

// API 요청 헬퍼
async function apiRequest<T>(
  endpoint: string,
  options: {
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): Promise<T | null> {
  const agent = getMtlsAgent();
  if (!agent) {
    throw new Error('mTLS not configured');
  }

  const url = `${APPS_IN_TOSS_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      // @ts-expect-error - Node.js fetch agent option
      agent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AppsInToss] API error: ${response.status} ${errorText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[AppsInToss] API request failed:', error);
    return null;
  }
}

// 주문 상태 조회
export async function getOrderStatus(
  orderId: string,
  tossUserKey: string
): Promise<IapOrderStatusResponse | null> {
  return apiRequest<IapOrderStatusResponse>(
    '/api-partner/v1/apps-in-toss/order/get-order-status',
    {
      method: 'POST',
      headers: {
        'x-toss-user-key': tossUserKey,
      },
      body: {
        orderId,
      },
    }
  );
}

// 구독 활성화 (내부 DB 업데이트)
export async function activateSubscription(params: {
  userId: string;
  orderId: string;
  sku: string;
  tossUserKey: string;
}): Promise<boolean> {
  // Supabase에 구독 정보 저장
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const now = new Date();
  const isYearly = params.sku.includes('yearly');
  const expiresAt = new Date(now);

  if (isYearly) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: params.userId,
      plan: 'premium',
      billing_cycle: isYearly ? 'yearly' : 'monthly',
      expires_at: expiresAt.toISOString(),
      auto_renew: true,
      toss_order_id: params.orderId,
      toss_user_key: params.tossUserKey,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('[AppsInToss] Failed to activate subscription:', error);
    return false;
  }

  return true;
}
