'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const savedLocale = typeof window !== 'undefined'
      ? localStorage.getItem('locale') || 'ko'
      : 'ko';

    router.replace(`/${savedLocale}`);
  }, [router]);

  return null;
}
