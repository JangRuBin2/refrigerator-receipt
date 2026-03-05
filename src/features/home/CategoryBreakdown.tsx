'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { spring } from '@/lib/animations';
import type { Category } from '@/types';
import { CATEGORY_EMOJI } from '@/lib/constants';

interface CategoryBreakdownProps {
  total: number;
  sortedCategories: [string, number][];
}

export function CategoryBreakdown({ total, sortedCategories }: CategoryBreakdownProps) {
  const t = useTranslations();

  if (sortedCategories.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.3 }}
    >
      <h2 className="toss-h3 mb-toss-sm">{t('home.categoryBreakdown')}</h2>
      <div className="toss-card space-y-3">
        {sortedCategories.map(([category, count], index) => {
          const percentage = Math.round((count / total) * 100);
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-lg">{CATEGORY_EMOJI[category as Category] ?? '📦'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="toss-body2 font-medium">{t(`categories.${category}`)}</span>
                  <span className="toss-caption">{count}{t('home.items')} ({percentage}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                    className="h-full rounded-full bg-primary-500"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
