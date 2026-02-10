import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';

const FREE_WEEKLY_LIMIT = 3;

export async function getScanUsage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Calculate start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString();

  // Count this week's scans from event_logs (same table as Edge Function)
  const { count: scanCount, error: scanError } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'receipt_scan')
    .gte('created_at', weekStartISO);

  if (scanError) throw scanError;

  // Check premium status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, subscription_end_date')
    .eq('id', user.id)
    .single();

  const isPremium = profile?.is_premium &&
    (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

  const used = scanCount ?? 0;
  const weeklyLimit = isPremium ? 999 : FREE_WEEKLY_LIMIT;
  const remaining = Math.max(0, weeklyLimit - used);

  return {
    dailyLimit: weeklyLimit,
    effectiveLimit: weeklyLimit,
    used,
    remaining,
    canWatchAd: false,
    isPremium: !!isPremium,
  };
}

export async function scanReceipt(file: File, useAIVision: boolean = true) {
  const base64 = await fileToBase64(file);
  return callEdgeFunction<{
    items: unknown[];
    mode: string;
    usage?: { dailyLimit: number; used: number; remaining: number };
  }>('receipts-scan', {
    body: { image: base64, useAIVision },
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
