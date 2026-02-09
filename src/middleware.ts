import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ['/login', '/api/auth', '/terms'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    const stripped = pathname.replace(/^\/(ko|en|ja|zh)/, '');
    return stripped === path || stripped.startsWith(path);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API auth routes는 그대로 통과
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // intl 미들웨어 먼저 실행
  const intlResponse = intlMiddleware(request);

  // 공개 경로는 인증 불필요
  if (isPublicPath(pathname)) {
    return intlResponse;
  }

  // Supabase 세션 확인
  let supabaseResponse = intlResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 로그인 안 된 사용자 → 로그인 페이지로 리다이렉트
    const locale = pathname.match(/^\/(ko|en|ja|zh)/)?.[1] || 'ko';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/(ko|en|ja|zh)/:path*'],
};
