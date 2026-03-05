'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Heart, Package, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { spring } from '@/lib/animations';

interface DashboardStatsProps {
  total: number;
  expiring: number;
  safeCount: number;
  favoriteCount: number;
}

export function DashboardStats({ total, expiring, safeCount, favoriteCount }: DashboardStatsProps) {
  const t = useTranslations();

  const statItems = [
    {
      label: t('home.totalIngredients'),
      value: total,
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('home.expiringCount2'),
      value: expiring,
      icon: AlertTriangle,
      color: expiring > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400',
      bg: expiring > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: t('home.freshCount'),
      value: safeCount,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: t('home.favoriteCount'),
      value: favoriteCount,
      icon: Heart,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.gentle, delay: 0.05 }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.snappy, delay: 0.05 + index * 0.03 }}
            className={`${stat.bg} rounded-2xl p-3 text-center`}
          >
            <stat.icon className={`mx-auto h-5 w-5 ${stat.color}`} />
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="toss-caption truncate">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
