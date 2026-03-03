import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';
import { clearAllUserData } from '@/lib/auth-cleanup';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearAllUserData();
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
  // Ensure previous session and all user data are fully cleared before new login
  const supabase = createClient();
  const { data: { user: existingUser } } = await supabase.auth.getUser();
  if (existingUser) {
    await supabase.auth.signOut();
    await new Promise((r) => setTimeout(r, 300));
  }
  // Always clear previous user data to prevent cross-user data leakage
  clearAllUserData();

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
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      return { success: false, error: sessionError.message };
    }

    // Verify session is established before returning
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '세션 설정에 실패했습니다. 다시 시도해주세요.' };
    }
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
  return callEdgeFunction('iap-activate', {
    body: params,
  });
}

export async function getIapStatus() {
  return callEdgeFunction('iap-status', {
    method: 'POST',
    body: {},
  });
}
