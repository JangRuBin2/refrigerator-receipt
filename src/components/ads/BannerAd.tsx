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
      variant: 'expanded',
      onRendered: () => setIsRendered(true),
      onFailed: () => setIsRendered(false),
    });

    cleanupRef.current = cleanup;

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isPremium, adGroupId]);

  if (isPremium) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-h-[96px]',
        isRendered
          ? '-mx-4 w-[calc(100%+2rem)]'
          : 'w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl',
        className
      )}
      aria-label="advertisement"
    />
  );
}
