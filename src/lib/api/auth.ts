import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

interface TossLoginResponse {
  success: boolean;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  user?: {
    id: string;
    email: string;
  };
  isNewUser?: boolean;
}

export async function tossLogin(authorizationCode: string, referrer: string): Promise<TossLoginResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-toss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    return { success: false, error: error.error || 'Login failed' };
  }

  const data: TossLoginResponse = await response.json();

  if (data.success && data.session) {
    const supabase = createClient();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return data;
}

export async function deleteAccount() {
  return callEdgeFunction('auth-delete-account', { method: 'POST' });
}

export async function iapActivate(params: {
  orderId: string;
  sku: string;
  tossUserKey: string | null;
}) {
  return callEdgeFunction<{ success: boolean }>('iap-activate', {
    body: params,
  });
}

export async function getIapStatus() {
  return callEdgeFunction<{ isPremium: boolean }>('iap-status', {
    method: 'POST',
    body: {},
  });
}
