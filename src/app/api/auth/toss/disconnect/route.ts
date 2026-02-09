import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validateBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const expectedToken = process.env.TOSS_DISCONNECT_AUTH;
  if (!expectedToken) {
    return false;
  }

  const receivedToken = authHeader.slice('Basic '.length);
  return receivedToken === expectedToken;
}

function parseParams(request: NextRequest): { userKey: number; referrer: string } | null {
  const url = new URL(request.url);
  const userKeyParam = url.searchParams.get('userKey');
  const referrerParam = url.searchParams.get('referrer');

  if (userKeyParam === null || referrerParam === null) {
    return null;
  }

  return {
    userKey: Number(userKeyParam),
    referrer: referrerParam,
  };
}

async function handleDisconnect(request: NextRequest): Promise<NextResponse> {
  if (!validateBasicAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const params = parseParams(request);

    if (!params || params.referrer !== 'UNLINK') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { userKey } = params;

    // 콘솔 테스트 요청 (userKey === 0)은 삭제 건너뛰기
    if (userKey === 0) {
      return NextResponse.json({ success: true, message: 'Test request acknowledged' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // toss_user_key로 사용자 조회
    const tossUserKey = String(userKey);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('toss_user_key', tossUserKey)
      .single();

    if (!profile) {
      return NextResponse.json({ success: true, message: 'User not found or already deleted' });
    }

    // 구독 해지
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: 'free',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id);

    // 사용자 삭제 (CASCADE로 연관 데이터 자동 삭제)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET, POST 모두 지원
export async function GET(request: NextRequest) {
  return handleDisconnect(request);
}

export async function POST(request: NextRequest) {
  return handleDisconnect(request);
}
