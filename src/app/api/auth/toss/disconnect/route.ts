import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://apps-in-toss.toss.im',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function validateBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const expectedToken = process.env.TOSS_DISCONNECT_AUTH;
  if (!expectedToken) {
    return false;
  }

  const receivedToken = authHeader.slice('Basic '.length).trim();

  // 1) Base64 토큰 직접 비교
  if (receivedToken === expectedToken) {
    return true;
  }

  // 2) 수신된 토큰을 디코딩하여 env 값과 비교 (토스가 Base64 인코딩해서 보내는 경우)
  try {
    const decoded = Buffer.from(receivedToken, 'base64').toString('utf-8');
    if (decoded === expectedToken) {
      return true;
    }
  } catch {
    // 디코딩 실패 시 무시
  }

  // 3) env 값을 인코딩하여 수신 토큰과 비교 (env에 평문 저장된 경우)
  const encodedExpected = Buffer.from(expectedToken).toString('base64');
  if (receivedToken === encodedExpected) {
    return true;
  }

  return false;
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
    return withCors(NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    ));
  }

  try {
    const params = parseParams(request);

    if (!params || params.referrer !== 'UNLINK') {
      return withCors(NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      ));
    }

    const { userKey } = params;

    // 콘솔 테스트 요청 (userKey === 0)은 삭제 건너뛰기
    if (userKey === 0) {
      return withCors(NextResponse.json({ success: true, message: 'Test request acknowledged' }));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return withCors(NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      ));
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
      return withCors(NextResponse.json({ success: true, message: 'User not found or already deleted' }));
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
      return withCors(NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      ));
    }

    return withCors(NextResponse.json({ success: true }));
  } catch {
    return withCors(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

// CORS preflight
export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET, POST 모두 지원
export async function GET(request: NextRequest) {
  return handleDisconnect(request);
}

export async function POST(request: NextRequest) {
  return handleDisconnect(request);
}
