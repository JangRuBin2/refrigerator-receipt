'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { getDaysUntilExpiry } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { TrialWelcomeModal } from '@/components/premium/TrialWelcomeModal';
import { TrialExpiringModal, isTrialExpiringDismissedToday } from '@/components/premium/TrialExpiringModal';
import { spring, listContainer, listItem } from '@/lib/animations';
import {
  AlertTriangle,
  Camera,
  ChefHat,
  ChevronRight,
  Crown,
  Heart,
  Lock,
  Package,
  Plus,
  Refrigerator,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Sun,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { Category } from '@/types';

const CATEGORY_EMOJI: Record<Category, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  meat: '🥩',
  seafood: '🐟',
  dairy: '🥛',
  condiments: '🧂',
  grains: '🌾',
  beverages: '🥤',
  snacks: '🍪',
  etc: '📦',
};

const STORAGE_CONFIG = [
  { key: 'refrigerated' as const, icon: Refrigerator, color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'frozen' as const, icon: Snowflake, color: 'bg-cyan-500', lightBg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { key: 'room_temp' as const, icon: Sun, color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
];

export default function HomePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const { ingredients, favoriteRecipeIds } = useStore();
  const { isPremium, isLoading: premiumLoading, isTrialActive, isTrialExpired, trialDaysRemaining } = usePremium();

  // Welcome modal for new users
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      window.history.replaceState({}, '', `/${locale}`);
    }
  }, [searchParams, locale]);

  // Trial expiring modal (show when <= 2 days remaining, once per day)
  const [showExpiring, setShowExpiring] = useState(false);
  useEffect(() => {
    if (!premiumLoading && isTrialActive && trialDaysRemaining <= 2 && !isTrialExpiringDismissedToday()) {
      setShowExpiring(true);
    }
  }, [premiumLoading, isTrialActive, trialDaysRemaining]);

  const today = new Date();
  const dateString = today.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Dashboard stats computed from ingredients
  const stats = useMemo(() => {
    const withDays = ingredients.map((item) => ({
      ...item,
      daysLeft: getDaysUntilExpiry(item.expiryDate),
    }));

    const expired = withDays.filter((i) => i.daysLeft < 0);
    const within3 = withDays.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3);
    const within7 = withDays.filter((i) => i.daysLeft > 3 && i.daysLeft <= 7);
    const safe = withDays.filter((i) => i.daysLeft > 7);

    const storageCount = {
      refrigerated: ingredients.filter((i) => i.storageType === 'refrigerated').length,
      frozen: ingredients.filter((i) => i.storageType === 'frozen').length,
      room_temp: ingredients.filter((i) => i.storageType === 'room_temp').length,
    };

    const categoryCount: Partial<Record<Category, number>> = {};
    for (const item of ingredients) {
      categoryCount[item.category] = (categoryCount[item.category] ?? 0) + 1;
    }
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const expiringItems = [...within3]
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);

    const recentItems = [...ingredients]
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 10);

    return {
      total: ingredients.length,
      expired,
      within3,
      within7,
      safe,
      expiring: expired.length + within3.length,
      storageCount,
      sortedCategories,
      expiringItems,
      recentItems,
      favoriteCount: favoriteRecipeIds.length,
    };
  }, [ingredients, favoriteRecipeIds]);

  const quickActions = [
    { icon: Camera, label: t('home.scanReceipt'), href: `/${locale}/scan`, color: 'bg-primary-500' },
    { icon: Refrigerator, label: t('nav.fridge'), href: `/${locale}/fridge`, color: 'bg-blue-500' },
    { icon: ChefHat, label: t('nav.recipes'), href: `/${locale}/recipes`, color: 'bg-amber-500' },
    { icon: ShoppingCart, label: t('shopping.title'), href: `/${locale}/shopping`, color: 'bg-teal-500' },
  ];

  const hasIngredients = ingredients.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header locale={locale} />

      <div className="space-y-toss-lg p-toss-md pb-24">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="pt-toss-sm"
        >
          <p className="toss-caption">{dateString}</p>
          <h1 className="toss-h1 mt-toss-xs">{t('home.welcome')}</h1>
          <p className="toss-body2 mt-toss-xs text-primary-600 dark:text-primary-400">
            {t('common.appName')}
          </p>
        </motion.section>

        {/* Trial Banner */}
        {isTrialActive && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.03 }}
          >
            <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 p-4 dark:from-primary-900/20 dark:to-blue-900/20 dark:border-primary-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary-100 p-2 dark:bg-primary-800">
                  <Crown className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="toss-body2 font-semibold text-primary-700 dark:text-primary-300">
                    {t('pricing.trialActive')}
                  </p>
                  <p className="toss-caption text-primary-600 dark:text-primary-400">
                    {t('pricing.trialDaysLeft', { days: trialDaysRemaining })}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Trial Expired Banner */}
        {isTrialExpired && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.03 }}
          >
            <Link href={`/${locale}/pricing`}>
              <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 p-4 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-800">
                    <Crown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="toss-body2 font-semibold text-orange-700 dark:text-orange-300">
                      {t('pricing.trialExpiredBanner')}
                    </p>
                    <p className="toss-caption text-orange-600 dark:text-orange-400">
                      {t('pricing.trialExpiredBannerDesc')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* Dashboard Stats Cards */}
        {hasIngredients && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.05 }}
          >
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: t('home.totalIngredients'),
                  value: stats.total,
                  icon: Package,
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-900/20',
                },
                {
                  label: t('home.expiringCount2'),
                  value: stats.expiring,
                  icon: AlertTriangle,
                  color: stats.expiring > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400',
                  bg: stats.expiring > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
                },
                {
                  label: t('home.freshCount'),
                  value: stats.safe.length,
                  icon: TrendingUp,
                  color: 'text-green-600 dark:text-green-400',
                  bg: 'bg-green-50 dark:bg-green-900/20',
                },
                {
                  label: t('home.favoriteCount'),
                  value: stats.favoriteCount,
                  icon: Heart,
                  color: 'text-pink-600 dark:text-pink-400',
                  bg: 'bg-pink-50 dark:bg-pink-900/20',
                },
              ].map((stat, index) => (
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
        )}

        {/* Empty State */}
        {!hasIngredients && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 }}
          >
            <div className="toss-card text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Refrigerator className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="toss-h3">{t('home.empty')}</h2>
              <p className="toss-body2 mt-2 text-gray-500">{t('home.emptyDescription')}</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link href={`/${locale}/scan`}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white"
                  >
                    {t('home.startScan')}
                  </motion.button>
                </Link>
                <Link href={`/${locale}/fridge/add`}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {t('home.addManual')}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Expiry Timeline Bar */}
        {hasIngredients && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 }}
          >
            <h2 className="toss-h3 mb-toss-sm">{t('home.expiryTimeline')}</h2>
            <div className="toss-card">
              {/* Stacked Bar */}
              <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                {stats.total > 0 && (
                  <>
                    {stats.expired.length > 0 && (
                      <div
                        className="bg-gray-400 transition-all"
                        style={{ width: `${(stats.expired.length / stats.total) * 100}%` }}
                      />
                    )}
                    {stats.within3.length > 0 && (
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${(stats.within3.length / stats.total) * 100}%` }}
                      />
                    )}
                    {stats.within7.length > 0 && (
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${(stats.within7.length / stats.total) * 100}%` }}
                      />
                    )}
                    {stats.safe.length > 0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(stats.safe.length / stats.total) * 100}%` }}
                      />
                    )}
                  </>
                )}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-4 gap-1 text-center">
                {[
                  { label: t('home.expiredItems'), count: stats.expired.length, color: 'bg-gray-400' },
                  { label: t('home.within3Days'), count: stats.within3.length, color: 'bg-red-500' },
                  { label: t('home.within7Days'), count: stats.within7.length, color: 'bg-amber-400' },
                  { label: t('home.safe'), count: stats.safe.length, color: 'bg-green-500' },
                ].map((item) => (
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
        )}

        {/* Expiring Alert Card */}
        {stats.expiringItems.length > 0 && (
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
                      {stats.expiringItems.length}{t('home.itemsExpiringSoon', { count: stats.expiringItems.length })}
                    </p>
                    <div className="mt-toss-sm flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {stats.expiringItems.map((item) => (
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
        )}

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <h2 className="toss-h3 mb-toss-sm">{t('home.quickActions')}</h2>
          <div className="grid grid-cols-4 gap-toss-sm">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring.snappy, delay: 0.2 + index * 0.05 }}
              >
                <Link href={action.href}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-toss-xs"
                  >
                    <div className={`${action.color} rounded-2xl p-3 text-white shadow-sm`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="toss-caption text-center line-clamp-1">{action.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Storage Breakdown */}
        {hasIngredients && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.25 }}
          >
            <h2 className="toss-h3 mb-toss-sm">{t('home.storageBreakdown')}</h2>
            <div className="grid grid-cols-3 gap-2">
              {STORAGE_CONFIG.map((storage) => {
                const count = stats.storageCount[storage.key];
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <motion.div
                    key={storage.key}
                    whileTap={{ scale: 0.97 }}
                    className={`${storage.lightBg} rounded-2xl p-3`}
                  >
                    <storage.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                      {count}<span className="toss-caption ml-0.5 font-normal">{t('home.items')}</span>
                    </p>
                    <p className="toss-caption">{t(`fridge.${storage.key === 'room_temp' ? 'roomTemp' : storage.key}`)}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/50 dark:bg-gray-600">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={`h-full rounded-full ${storage.color}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Category Breakdown */}
        {stats.sortedCategories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.3 }}
          >
            <h2 className="toss-h3 mb-toss-sm">{t('home.categoryBreakdown')}</h2>
            <div className="toss-card space-y-3">
              {stats.sortedCategories.map(([category, count], index) => {
                const percentage = Math.round((count / stats.total) * 100);
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
        )}

        {/* AI Recipe Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.35 }}
        >
          <Link href={`/${locale}/recommend`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-amber-500 p-toss-md text-white"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">{t('home.whatToEat')}</span>
                </div>
                <p className="mt-toss-xs text-sm text-white/80">
                  {t('recommend.description')}
                </p>
              </div>
              <div className="absolute -right-4 -top-4 opacity-20">
                <ChefHat className="h-24 w-24" />
              </div>
            </motion.div>
          </Link>
        </motion.section>

        {/* Recent Items */}
        {stats.recentItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.4 }}
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
              {stats.recentItems.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                return (
                  <motion.div
                    key={item.id}
                    variants={listItem}
                    className="flex-shrink-0"
                  >
                    <div className="toss-card w-32 text-center">
                      <span className="text-xl">{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
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
        )}

        {/* Feature Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.45 }}
          className="space-y-toss-sm"
        >
          <Link href={`/${locale}/nutrition`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="toss-card flex items-center gap-toss-md"
            >
              <div className="rounded-2xl bg-violet-100 p-3 dark:bg-violet-900/30">
                <Activity className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="toss-body1 font-semibold">{t('nutrition.title')}</h3>
                <p className="toss-caption">{t('home.nutritionDescription')}</p>
              </div>
              {!isPremium ? (
                <Lock className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </motion.div>
          </Link>

          <Link href={`/${locale}/shopping`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="toss-card flex items-center gap-toss-md"
            >
              <div className="rounded-2xl bg-teal-100 p-3 dark:bg-teal-900/30">
                <ShoppingCart className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="toss-body1 font-semibold">{t('shopping.title')}</h3>
                <p className="toss-caption">{t('home.shoppingDescription')}</p>
              </div>
              {!isPremium ? (
                <Lock className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </motion.div>
          </Link>

          {/* Manual Add - Free */}
          <Link href={`/${locale}/fridge/add`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="toss-card flex items-center gap-toss-md"
            >
              <div className="rounded-2xl bg-green-100 p-3 dark:bg-green-900/30">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="toss-body1 font-semibold">{t('fridge.manualAdd')}</h3>
                <p className="toss-caption">{t('fridge.addIngredient')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </motion.div>
          </Link>
        </motion.section>
      </div>

      {/* Trial Welcome Modal */}
      <TrialWelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />

      {/* Trial Expiring Modal */}
      <TrialExpiringModal
        isOpen={showExpiring}
        onClose={() => setShowExpiring(false)}
        daysRemaining={trialDaysRemaining}
      />
    </div>
  );
}
