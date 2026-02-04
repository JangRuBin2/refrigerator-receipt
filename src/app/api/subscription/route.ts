import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionResponse } from '@/types/subscription';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isPremium: false,
        plan: 'free'
      } as SubscriptionResponse);
    }

    // 구독 정보 조회
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      return NextResponse.json({
        isPremium: false,
        plan: 'free'
      } as SubscriptionResponse);
    }

    // 프리미엄 상태 확인 (plan이 premium이고 만료되지 않은 경우)
    const now = new Date();
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;
    const isPremium = subscription.plan === 'premium' &&
                      (!expiresAt || expiresAt > now);

    return NextResponse.json({
      isPremium,
      plan: isPremium ? 'premium' : 'free',
      billingCycle: subscription.billing_cycle,
      expiresAt: subscription.expires_at,
      autoRenew: subscription.auto_renew,
    } as SubscriptionResponse);

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({
      isPremium: false,
      plan: 'free'
    } as SubscriptionResponse);
  }
}
