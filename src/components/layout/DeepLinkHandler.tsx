'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Handles deep-link navigation after hydration.
 *
 * When the Toss WebView serves root index.html for a deep-linked URL
 * (e.g. /ko/shopping/), the URL is temporarily changed to /ko/ via
 * history.replaceState() to prevent hydration mismatch.
 * The actual path is stored in window.__MK_ACTUAL_PATH__.
 *
 * After React hydrates, this component picks up the saved path
 * and navigates to it using Next.js client-side routing.
 */
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const w = window as unknown as { __MK_ACTUAL_PATH__?: string };
    const actualPath = w.__MK_ACTUAL_PATH__;
    if (actualPath) {
      delete w.__MK_ACTUAL_PATH__;
      router.replace(actualPath);
    }
  }, [router]);

  return null;
}
