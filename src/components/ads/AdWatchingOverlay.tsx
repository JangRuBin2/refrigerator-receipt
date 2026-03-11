'use client';

import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdWatchingOverlayProps {
  isVisible: boolean;
}

export function AdWatchingOverlay({ isVisible }: AdWatchingOverlayProps) {
  const t = useTranslations();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="rounded-2xl bg-white p-8 text-center dark:bg-gray-800">
        <PlayCircle className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
        <p className="mt-4 text-lg font-semibold">{t('ads.watchingAd')}</p>
        <p className="mt-2 text-sm text-gray-500">{t('ads.adWatchingDescription')}</p>
      </div>
    </motion.div>
  );
}
