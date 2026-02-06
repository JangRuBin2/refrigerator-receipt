import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 토스 사용자를 위한 이메일 생성
function generateTossEmail(tossUserKey: string): string {
  return `toss_${tossUserKey}@mealkeeper.internal`;
}

// 토스 사용자를 위한 비밀번호 생성 (tossUserKey + 시크릿 기반)
function generateTossPassword(tossUserKey: string): string {
  const secret = process.env.TOSS_AUTH_SECRET || 'default-toss-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(tossUserKey)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { tossUserKey } = await request.json();

    if (!tossUserKey || typeof tossUserKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid tossUserKey' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 서비스 롤 키로 Supabase 클라이언트 생성 (관리자 권한)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const email = generateTossEmail(tossUserKey);
    const password = generateTossPassword(tossUserKey);

    // 사용자 존재 여부 확인 및 로그인 시도
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // 로그인 성공 - 쿠키에 세션 저장
      const cookieStore = await cookies();

      cookieStore.set('sb-access-token', signInData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: signInData.session.expires_in,
        path: '/',
      });

      cookieStore.set('sb-refresh-token', signInData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          id: signInData.user?.id,
          email: signInData.user?.email,
        },
      });
    }

    // 사용자가 없으면 새로 생성
    if (signInError?.message?.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 이메일 확인 건너뛰기
        user_metadata: {
          toss_user_key: tossUserKey,
          auth_provider: 'toss',
        },
      });

      if (signUpError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      // 새 사용자 로그인
      const { data: newSignInData, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (newSignInError || !newSignInData?.session) {
        return NextResponse.json(
          { success: false, error: 'Failed to sign in new user' },
          { status: 500 }
        );
      }

      // 프로필 생성
      await supabaseAdmin.from('profiles').upsert({
        id: signUpData.user.id,
        email,
        name: '토스 사용자',
        toss_user_key: tossUserKey,
        updated_at: new Date().toISOString(),
      });

      // 쿠키에 세션 저장
      const cookieStore = await cookies();

      cookieStore.set('sb-access-token', newSignInData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newSignInData.session.expires_in,
        path: '/',
      });

      cookieStore.set('sb-refresh-token', newSignInData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newSignInData.user?.id,
          email: newSignInData.user?.email,
        },
        isNewUser: true,
      });
    }

    return NextResponse.json(
      { success: false, error: signInError?.message || 'Authentication failed' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
