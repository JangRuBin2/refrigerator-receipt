import { createClient } from '@/lib/supabase/client';
import { callEdgeFunction } from './edge';

const FREE_DAILY_LIMIT = 3;
const AD_BONUS_SCANS = 1;

export async function getScanUsage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const today = new Date().toISOString().split('T')[0];

  // Count today's scans
  const { count: scanCount, error: scanError } = await supabase
    .from('receipt_scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (scanError) throw scanError;

  // Count today's ad rewards
  const { count: adCount, error: adError } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'ad_reward')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (adError) throw adError;

  // Check premium status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user.id)
    .single();

  const isPremium = subscription?.plan === 'premium' &&
    new Date(subscription.expires_at) > new Date();

  const used = scanCount ?? 0;
  const adBonuses = (adCount ?? 0) * AD_BONUS_SCANS;
  const dailyLimit = isPremium ? 999 : FREE_DAILY_LIMIT;
  const effectiveLimit = dailyLimit + adBonuses;
  const remaining = Math.max(0, effectiveLimit - used);

  return {
    dailyLimit,
    effectiveLimit,
    used,
    remaining,
    canWatchAd: !isPremium && remaining <= 0,
    isPremium,
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

export async function getAdRewardStatus() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('event_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('event_type', 'ad_reward')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (error) throw error;
  return { todayCount: data?.length ?? 0 };
}

export async function claimAdReward(adGroupId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('event_logs')
    .insert({
      user_id: user.id,
      event_type: 'ad_reward',
      metadata: adGroupId ? { adGroupId } : undefined,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
