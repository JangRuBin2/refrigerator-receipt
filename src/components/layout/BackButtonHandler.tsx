'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 토스 미니앱 뒤로가기 핸들러
 * - 최초 화면(홈)에서 뒤로가기 누르면 closeView()로 미니앱 종료
 * - 서브 화면에서는 브라우저 히스토리 뒤로가기
 */
export function BackButtonHandler() {
  const pathname = usePathname();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const { graniteEvent } = await import('@apps-in-toss/web-bridge');

        cleanup = graniteEvent.addEventListener('backEvent', {
          onEvent: async () => {
            const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
            if (isHome) {
              try {
                const { closeView } = await import('@apps-in-toss/web-bridge');
                await closeView();
              } catch {
                window.history.back();
              }
            } else {
              window.history.back();
            }
          },
        });
      } catch {
        // 앱인토스 환경이 아닌 경우 무시
      }
    }

    setup();

    return () => {
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
