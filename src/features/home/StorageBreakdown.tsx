'use client';

import { motion } from 'framer-motion';
import { Refrigerator, Snowflake, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { spring } from '@/lib/animations';

const STORAGE_CONFIG = [
  { key: 'refrigerated' as const, icon: Refrigerator, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'frozen' as const, icon: Snowflake, color: 'bg-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { key: 'room_temp' as const, icon: Sun, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
];

interface StorageBreakdownProps {
  total: number;
  storageCount: Record<'refrigerated' | 'frozen' | 'room_temp', number>;
}

export function StorageBreakdown({ total, storageCount }: StorageBreakdownProps) {
  const t = useTranslations();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.25 }}
    >
      <h2 className="toss-h3 mb-toss-sm">{t('home.storageBreakdown')}</h2>
      <div className="grid grid-cols-3 gap-2">
        {STORAGE_CONFIG.map((storage) => {
          const count = storageCount[storage.key];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <motion.div
              key={storage.key}
              whileTap={{ scale: 0.97 }}
              className={`${storage.lightBg} rounded-2xl p-3 text-center`}
            >
              <storage.icon className="mx-auto h-5 w-5 text-gray-600 dark:text-gray-300" />
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {count}<span className="toss-caption ml-0.5 font-normal">{t('home.items')}</span>
              </p>
              <p className="toss-caption">{t(`fridge.${storage.key === 'room_temp' ? 'roomTemp' : storage.key}`)}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
