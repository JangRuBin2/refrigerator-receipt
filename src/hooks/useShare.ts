import { useCallback } from 'react';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

export function useShare() {
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const share = useCallback(async (options: ShareOptions): Promise<boolean> => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return true;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {
      return false;
    }
  }, [canNativeShare]);

  return { share, canNativeShare };
}
