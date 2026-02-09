import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabaseAdmin = await createServiceClient();

    // 구독 해지
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: 'free',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // 사용자 삭제 (CASCADE로 연관 데이터 자동 삭제)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    // 세션 로그아웃
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
