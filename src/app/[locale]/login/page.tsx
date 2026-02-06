'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { isAppsInTossEnvironment, getTossUserKey } from '@/lib/apps-in-toss/sdk';

export default function LoginPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInToss, setIsInToss] = useState(false);
  const [isCheckingEnvironment, setIsCheckingEnvironment] = useState(true);

  useEffect(() => {
    // 환경 감지 및 로그인 상태 확인
    const init = async () => {
      const inToss = isAppsInTossEnvironment();
      setIsInToss(inToss);
      setIsCheckingEnvironment(false);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(`/${locale}`);
      }
    };
    init();
  }, [locale, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleTossLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tossUserKey = await getTossUserKey();

      if (!tossUserKey) {
        setError(t('auth.loginRequired'));
        setIsLoading(false);
        return;
      }

      // 토스 사용자 키로 서버에 로그인 요청
      const response = await fetch('/api/auth/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tossUserKey }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/${locale}`);
      } else {
        setError(data.error || t('auth.loginRequired'));
        setIsLoading(false);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  if (isCheckingEnvironment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <span className="text-4xl">🍳</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('common.appName')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('auth.loginDescription')}
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            {isInToss ? (
              // 토스 환경: 토스 로그인만 표시
              <Button
                onClick={handleTossLogin}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" fill="currentColor" />
                    <path
                      d="M8 12h8M12 8v8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {t('auth.loginWithToss')}
              </Button>
            ) : (
              // 일반 환경: Google 로그인
              <Button
                onClick={handleGoogleLogin}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {t('auth.loginWithGoogle')}
              </Button>
            )}

            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              {t('auth.loginRequired')}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <span className="text-xl">📸</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('features.scan')}
            </p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <span className="text-xl">⏰</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('features.expiry')}
            </p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <span className="text-xl">🍽️</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('features.recipe')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
