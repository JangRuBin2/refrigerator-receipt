'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useDebugRender } from '@/hooks/useDebugRender';

const PUBLIC_PATHS = ['/login', '/terms', '/recipe', '/guide'];

function isPublicPath(pathname: string): boolean {
  const stripped = pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '')
    .replace(/^\/(ko|en|ja|zh)/, '');

  // Home path (empty after stripping locale) is always accessible
  if (stripped === '') return true;

  return PUBLIC_PATHS.some((path) => {
    return stripped === path || stripped.startsWith(path);
  });
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useDebugRender('AuthGuard');
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const params = useParams();
  const pathname = usePathname();
  const locale = (params.locale as string) || 'ko';

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const currentPath = window.location.pathname;

      if (isPublicPath(currentPath)) {
        if (!cancelled) setIsAuthed(true);
        return;
      }

      if (!isSupabaseConfigured()) {
        if (!cancelled) setIsAuthed(true);
        return;
      }

      try {
        const supabase = createClient();

        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 5000)
        );

        const { data: { user } } = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ]);

        if (cancelled) return;

        if (user) {
          setIsAuthed(true);
          return;
        }

        // Prevent redirect loop: only redirect if not already heading to login
        if (!currentPath.includes('/login')) {
          setIsAuthed(false);
          window.location.href = `/${locale}/login/`;
        }
      } catch {
        if (cancelled) return;
        if (!window.location.pathname.includes('/login')) {
          setIsAuthed(false);
          window.location.href = `/${locale}/login/`;
        }
      }
    };

    checkAuth();

    return () => { cancelled = true; };
  }, [locale, pathname]);

  if (isAuthed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthed === false) {
    return null;
  }

  return <>{children}</>;
}
