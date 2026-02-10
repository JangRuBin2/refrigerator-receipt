'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const PUBLIC_PATHS = ['/login', '/terms'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    const stripped = pathname
      .replace(/\.html$/, '')
      .replace(/\/index$/, '')
      .replace(/\/$/, '')
      .replace(/^\/(ko|en|ja|zh)/, '');
    return stripped === path || stripped.startsWith(path) || stripped === '';
  });
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const params = useParams();
  const pathname = usePathname();
  const locale = (params.locale as string) || 'ko';

  useEffect(() => {
    const checkAuth = async () => {
      const currentPath = window.location.pathname;

      if (isPublicPath(currentPath)) {
        setIsAuthed(true);
        return;
      }

      if (!isSupabaseConfigured()) {
        setIsAuthed(true);
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

        if (user) {
          setIsAuthed(true);
          return;
        }

        setIsAuthed(false);
        window.location.href = `/${locale}/login/`;
      } catch {
        setIsAuthed(false);
        window.location.href = `/${locale}/login/`;
      }
    };

    checkAuth();
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
