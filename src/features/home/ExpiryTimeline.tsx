'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { spring } from '@/lib/animations';

interface ExpiryTimelineProps {
  total: number;
  expiredCount: number;
  within3Count: number;
  within7Count: number;
  safeCount: number;
}

export function ExpiryTimeline({ total, expiredCount, within3Count, within7Count, safeCount }: ExpiryTimelineProps) {
  const t = useTranslations();

  const segments = [
    { label: t('home.expiredItems'), count: expiredCount, color: 'bg-gray-400' },
    { label: t('home.within3Days'), count: within3Count, color: 'bg-red-500' },
    { label: t('home.within7Days'), count: within7Count, color: 'bg-amber-400' },
    { label: t('home.safe'), count: safeCount, color: 'bg-green-500' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.1 }}
    >
      <h2 className="toss-h3 mb-toss-sm">{t('home.expiryTimeline')}</h2>
      <div className="toss-card">
        <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          {total > 0 && segments.map((seg) =>
            seg.count > 0 ? (
              <div
                key={seg.label}
                className={`${seg.color} transition-all`}
                style={{ width: `${(seg.count / total) * 100}%` }}
              />
            ) : null
          )}
        </div>
        <div className="grid grid-cols-2 gap-1 text-center sm:grid-cols-4">
          {segments.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
