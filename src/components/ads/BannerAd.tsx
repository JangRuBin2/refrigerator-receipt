'use client';

import { useEffect, useRef, useState } from 'react';
import { usePremium } from '@/hooks/usePremium';
import {
  isTossAdsBannerSupported,
  initializeTossAds,
  attachBannerAd,
} from '@/lib/apps-in-toss/ads';
import { BANNER_AD_IDS } from '@/types/apps-in-toss-ads';
import { cn } from '@/lib/utils';

interface BannerAdProps {
  adGroupId?: string;
  className?: string;
}

export function BannerAd({
  adGroupId = BANNER_AD_IDS.HOME_BANNER,
  className,
}: BannerAdProps) {
  const { isPremium } = usePremium();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isPremium) return;
    if (!isTossAdsBannerSupported()) return;
    if (!containerRef.current) return;

    initializeTossAds();

    const cleanup = attachBannerAd(adGroupId, containerRef.current, {
      theme: undefined, // auto (follows system dark mode)
      callbacks: {
        onRendered: () => setIsRendered(true),
        onFailed: () => setIsRendered(false),
      },
    } as Parameters<typeof attachBannerAd>[2]);

    cleanupRef.current = cleanup;

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isPremium, adGroupId]);

  // Premium users see no ads
  if (isPremium) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-hidden rounded-xl',
        !isRendered && 'min-h-0',
        className
      )}
      aria-label="advertisement"
    />
  );
}
