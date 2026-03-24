'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring, listContainer, listItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslations } from 'next-intl';
import { getDaysUntilExpiry, getExpiryColor } from '@/lib/utils';
import type { Ingredient } from '@/types';

interface CheckExpiryStepProps {
  onNext: () => void;
}

export function CheckExpiryStep({ onNext }: CheckExpiryStepProps) {
  const t = useTranslations('tutorial');
  const tc = useTranslations('categories');
  const mockIngredients = useTutorialStore((s) => s.mockIngredients);
  const addMockIngredient = useTutorialStore((s) => s.addMockIngredient);
  const [showTimeline, setShowTimeline] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // Add demo items with various expiry states if not enough
  useEffect(() => {
    if (mockIngredients.length < 3) {
      const today = new Date();

      const demoItems = [
        {
          name: t('checkExpiry.demoItems.milk'),
          category: 'dairy' as const,
          storageType: 'refrigerated' as const,
          quantity: 1,
          unit: 'L' as const,
          purchaseDate: new Date(today.getTime() - 5 * 86400000).toISOString().split('T')[0],
          expiryDate: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0],
        },
        {
          name: t('checkExpiry.demoItems.chicken'),
          category: 'meat' as const,
          storageType: 'refrigerated' as const,
          quantity: 500,
          unit: 'g' as const,
          purchaseDate: new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0],
          expiryDate: new Date(today.getTime() + 0 * 86400000).toISOString().split('T')[0],
        },
        {
          name: t('checkExpiry.demoItems.apple'),
          category: 'fruits' as const,
          storageType: 'refrigerated' as const,
          quantity: 5,
          unit: 'ea' as const,
          purchaseDate: new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0],
          expiryDate: new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0],
        },
      ];

      demoItems.forEach((item) => addMockIngredient(item));
    }
    setTimeout(() => setShowTimeline(true), 500);
  }, []);

  const sortedByExpiry = [...mockIngredients].sort((a, b) => {
    return getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate);
  });

  const getStatusEmoji = (days: number) => {
    if (days < 0) return '\u274C';
    if (days === 0) return '\u26A0\uFE0F';
    if (days <= 3) return '\uD83D\uDFE1';
    return '\uD83D\uDFE2';
  };

  const getBarWidth = (days: number) => {
    if (days < 0) return 100;
    if (days === 0) return 90;
    const maxDays = 14;
    return Math.max(10, Math.min(100, ((maxDays - days) / maxDays) * 100));
  };

  const getBarColor = (days: number) => {
    if (days < 0) return 'bg-gray-400';
    if (days === 0) return 'bg-red-500';
    if (days <= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col px-6 pt-4">
      {/* Header */}
      <motion.div
        className="mb-6 rounded-2xl bg-orange-50 p-4 dark:bg-orange-900/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.snappy}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{'\u23F0'}</span>
          <div>
            <p className="font-semibold text-orange-700 dark:text-orange-300">
              {t('checkExpiry.title')}
            </p>
            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
              {t('checkExpiry.description')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Expiry timeline */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            className="flex-1 space-y-3"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            {sortedByExpiry.map((ingredient) => {
              const days = getDaysUntilExpiry(ingredient.expiryDate);
              return (
                <motion.div
                  key={ingredient.id}
                  className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
                  variants={listItem}
                  transition={spring.snappy}
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusEmoji(days)}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {ingredient.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tc(ingredient.category)}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${getExpiryColor(days)}`}>
                      {days < 0
                        ? t('checkExpiry.expired')
                        : days === 0
                          ? t('checkExpiry.today')
                          : t('checkExpiry.daysLeft', { days })}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(days)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${getBarWidth(days)}%` }}
                      transition={{ ...spring.gentle, delay: 0.3 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        className="mt-4 flex justify-center gap-4 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span>{'\uD83D\uDFE2'} {t('checkExpiry.legend.safe')}</span>
        <span>{'\uD83D\uDFE1'} {t('checkExpiry.legend.warning')}</span>
        <span>{'\u26A0\uFE0F'} {t('checkExpiry.legend.danger')}</span>
        <span>{'\u274C'} {t('checkExpiry.legend.expired')}</span>
      </motion.div>

      <motion.div
        className="mt-6 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Button variant="toss" onClick={onNext}>
          {t('common.next')}
        </Button>
      </motion.div>
    </div>
  );
}
