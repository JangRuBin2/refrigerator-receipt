'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { getDaysUntilExpiry } from '@/lib/utils';
import { listContainer, listItem } from '@/lib/animations';
import { CATEGORY_EMOJI } from '@/lib/constants';
import type { Category, Ingredient } from '@/types';

interface RecentItemsProps {
  locale: string;
  items: Ingredient[];
}

export function RecentItems({ locale, items }: RecentItemsProps) {
  const t = useTranslations();

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-toss-sm">
        <h2 className="toss-h3">{t('home.recentItems')}</h2>
        <Link
          href={`/${locale}/fridge`}
          className="toss-caption text-primary-600 dark:text-primary-400"
        >
          {t('home.viewAll')}
        </Link>
      </div>
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex gap-toss-sm overflow-x-auto pb-2 scrollbar-hide"
      >
        {items.map((item) => {
          const daysLeft = getDaysUntilExpiry(item.expiryDate);
          return (
            <motion.div
              key={item.id}
              variants={listItem}
              className="flex-shrink-0"
            >
              <div className="toss-card w-32 text-center">
                <span className="text-xl">{CATEGORY_EMOJI[item.category as Category] ?? '📦'}</span>
                <p className="toss-body2 font-medium truncate mt-1">{item.name}</p>
                <p className="toss-caption mt-0.5">
                  {item.quantity} {t(`units.${item.unit}`)}
                </p>
                <Badge
                  variant={daysLeft <= 0 ? 'danger' : daysLeft <= 3 ? 'warning' : 'success'}
                  className="mt-1 text-xs"
                >
                  {daysLeft < 0 ? t('fridge.expired') : `D-${daysLeft}`}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
