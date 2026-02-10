import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function tossLogin(tossUserKey: string) {
  return callEdgeFunction<{ success: boolean; error?: string }>('auth-toss', {
    body: { tossUserKey },
  });
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
