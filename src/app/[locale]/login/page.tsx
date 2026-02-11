'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { tossAppLogin } from '@/lib/apps-in-toss/sdk';
import { tossLogin } from '@/lib/api/auth';

export default function LoginPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(`/${locale}`);
      }
    };
    checkExistingSession();
  }, [locale, router]);

  const handleTossLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: 토스 네이티브 로그인 (한 번만 호출)
      const loginResult = await tossAppLogin();
      if (!loginResult) {
        setError(t('auth.loginCancelled'));
        setIsLoading(false);
        return;
      }

      // Step 2: 서버 토큰 교환 (실패 시 1회 재시도)
      let data = await tossLogin(loginResult.authorizationCode, loginResult.referrer);

      if (!data.success) {
        await new Promise((r) => setTimeout(r, 500));
        data = await tossLogin(loginResult.authorizationCode, loginResult.referrer);
      }

      if (data.success) {
        const welcomeParam = data.isNewUser ? '?welcome=true' : '';
        window.location.href = `/${locale}/${welcomeParam}`;
        return;
      }

      setError(data.error || t('auth.loginFailed'));
      setIsLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${t('auth.loginError')}: ${msg}`);
      setIsLoading(false);
    }
  };

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
