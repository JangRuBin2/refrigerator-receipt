'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PUBLIC_PATHS = ['/login', '/terms'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    const stripped = pathname.replace(/^\/(ko|en|ja|zh)/, '');
    return stripped === path || stripped.startsWith(path);
  });
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ko';

  useEffect(() => {
    const checkAuth = async () => {
      const pathname = window.location.pathname;

      if (isPublicPath(pathname)) {
        setIsAuthed(true);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/${locale}/login`);
        return;
      }

      setIsAuthed(true);
    };

    checkAuth();
  }, [locale, router]);

  if (isAuthed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
