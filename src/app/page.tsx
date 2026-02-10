'use client';

import { useEffect } from 'react';

export default function RootPage() {
  useEffect(() => {
    const savedLocale = typeof window !== 'undefined'
      ? localStorage.getItem('locale') || 'ko'
      : 'ko';

    // 정적 .ait 번들에서는 router.replace()가 안 될 수 있으므로 직접 이동
    window.location.href = `/${savedLocale}/`;
  }, []);

  return null;
}
