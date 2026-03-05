'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { spring } from '@/lib/animations';

interface ExpiringItem {
  id: string;
  name: string;
  daysLeft: number;
}

interface ExpiringAlertProps {
  locale: string;
  items: ExpiringItem[];
}

export function ExpiringAlert({ locale, items }: ExpiringAlertProps) {
  const t = useTranslations();

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.15 }}
    >
      <Link href={`/${locale}/fridge`}>
        <div className="toss-card border-l-4 border-amber-500">
          <div className="flex items-start gap-toss-sm">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="toss-h3 text-amber-700 dark:text-amber-300">
                {t('home.expiringItems')}
              </h2>
              <p className="toss-body2 mt-toss-xs">
                {items.length}{t('home.itemsExpiringSoon', { count: items.length })}
              </p>
              <div className="mt-toss-sm flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-700"
                  >
                    <span className="toss-body2 font-medium">{item.name}</span>
                    <Badge
                      variant={item.daysLeft <= 0 ? 'danger' : 'warning'}
                      className="ml-2 text-xs"
                    >
                      {item.daysLeft < 0
                        ? t('fridge.expired')
                        : item.daysLeft === 0
                          ? t('fridge.today')
                          : `D-${item.daysLeft}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </Link>
    </motion.section>
  );
}
