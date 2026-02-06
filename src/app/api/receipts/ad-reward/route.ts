import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 광고 시청으로 얻는 추가 스캔 횟수
const AD_REWARD_SCANS = 1;
// 하루 최대 광고 시청 횟수
const MAX_AD_WATCHES_PER_DAY = 3;

interface AdWatchRecord {
  id: string;
}

// 광고 시청 후 추가 스캔 횟수 부여
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { adGroupId } = body;

    if (!adGroupId) {
      return NextResponse.json({ error: 'adGroupId is required' }, { status: 400 });
    }

    // 오늘 광고 시청 횟수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: adWatchCount } = await supabase
      .from('event_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'ad_watch_scan_reward')
      .gte('created_at', todayISO);

    const currentAdWatches = adWatchCount || 0;

    if (currentAdWatches >= MAX_AD_WATCHES_PER_DAY) {
      return NextResponse.json(
        {
          error: '오늘 광고 시청 한도에 도달했습니다. 내일 다시 시도해주세요.',
          maxReached: true,
          maxAdWatches: MAX_AD_WATCHES_PER_DAY,
          currentAdWatches,
        },
        { status: 429 }
      );
    }

    // 광고 시청 이벤트 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventRecord, error: insertError } = await (supabase
      .from('event_logs') as any)
      .insert({
        user_id: user.id,
        event_type: 'ad_watch_scan_reward',
        metadata: {
          ad_group_id: adGroupId,
          reward_scans: AD_REWARD_SCANS,
        },
      })
      .select('id')
      .single() as { data: AdWatchRecord | null; error: Error | null };

    if (insertError) {
      throw insertError;
    }

    // 오늘 총 스캔 가능 횟수 계산 (광고 보상 포함)
    const { count: todayAdRewards } = await supabase
      .from('event_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'ad_watch_scan_reward')
      .gte('created_at', todayISO);

    const bonusScans = (todayAdRewards || 0) * AD_REWARD_SCANS;

    return NextResponse.json({
      success: true,
      eventId: eventRecord?.id,
      rewardScans: AD_REWARD_SCANS,
      totalBonusScans: bonusScans,
      remainingAdWatches: MAX_AD_WATCHES_PER_DAY - currentAdWatches - 1,
    });
  } catch (error) {
    console.error('Ad reward error:', error);
    return NextResponse.json(
      { error: '보상 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 광고 시청 가능 여부 및 보상 정보 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 오늘 광고 시청 횟수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: adWatchCount } = await supabase
      .from('event_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'ad_watch_scan_reward')
      .gte('created_at', todayISO);

    const currentAdWatches = adWatchCount || 0;
    const remainingAdWatches = Math.max(0, MAX_AD_WATCHES_PER_DAY - currentAdWatches);
    const totalBonusScans = currentAdWatches * AD_REWARD_SCANS;

    return NextResponse.json({
      canWatchAd: remainingAdWatches > 0,
      remainingAdWatches,
      currentAdWatches,
      maxAdWatches: MAX_AD_WATCHES_PER_DAY,
      rewardScansPerAd: AD_REWARD_SCANS,
      totalBonusScans,
    });
  } catch (error) {
    console.error('Ad reward status error:', error);
    return NextResponse.json(
      { error: 'Failed to get ad reward status' },
      { status: 500 }
    );
  }
}
