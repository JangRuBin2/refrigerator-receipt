'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';

export function useExpiredCleanup() {
  const t = useTranslations();
  const { settings, ingredients, removeExpiredIngredients } = useStore();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiredCount = ingredients.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      return expiry < now;
    }).length;

    if (expiredCount === 0) return;

    if (settings.autoDeleteExpired) {
      const removed = removeExpiredIngredients();
      if (removed.length > 0) {
        toast.success(
          t('settings.expiredCleanupDone', { count: removed.length })
        );
      }
    }
  }, [settings.autoDeleteExpired, ingredients, removeExpiredIngredients, t]);
}
