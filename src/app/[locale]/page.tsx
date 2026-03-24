'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { getDaysUntilExpiry } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { useExpiredCleanup } from '@/hooks/useExpiredCleanup';
import { useDebugRender } from '@/hooks/useDebugRender';
import { TrialWelcomeModal } from '@/components/premium/TrialWelcomeModal';
import { TrialExpiringModal, isTrialExpiringDismissedToday } from '@/components/premium/TrialExpiringModal';
import { BannerAd } from '@/components/ads/BannerAd';
import { spring } from '@/lib/animations';
import { Camera, ChefHat, ChevronRight, Crown, Refrigerator, ShoppingCart, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { Category } from '@/types';

import { DashboardStats } from '@/features/home/DashboardStats';
import { ExpiryTimeline } from '@/features/home/ExpiryTimeline';
import { ExpiringAlert } from '@/features/home/ExpiringAlert';
import { StorageBreakdown } from '@/features/home/StorageBreakdown';
import { CategoryBreakdown } from '@/features/home/CategoryBreakdown';
import { RecentItems } from '@/features/home/RecentItems';
import { FeatureCards } from '@/features/home/FeatureCards';

export default function HomePage() {
  useDebugRender('HomePage');
  const t = useTranslations();
  useExpiredCleanup();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const { ingredients, favoriteRecipeIds } = useStore();
  const { isPremium, isLoading: premiumLoading, isTrialActive, isTrialExpired, trialDaysRemaining } = usePremium();

  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      window.history.replaceState({}, '', `/${locale}`);
    }
  }, [searchParams, locale]);

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

  const quickActions = useMemo(() => [
    { icon: Camera, label: t('home.scanReceipt'), href: `/${locale}/scan`, color: 'bg-primary-500' },
    { icon: Refrigerator, label: t('nav.fridge'), href: `/${locale}/fridge`, color: 'bg-blue-500' },
    { icon: ChefHat, label: t('nav.recipes'), href: `/${locale}/recipes`, color: 'bg-amber-500' },
    { icon: ShoppingCart, label: t('shopping.title'), href: `/${locale}/shopping`, color: 'bg-teal-500' },
  ], [t, locale]);

  const hasIngredients = ingredients.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="space-y-toss-lg p-toss-md pb-8">
        {/* Hero */}
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
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.gentle, delay: 0.03 }}>
            <Link href={`/${locale}/pricing`}>
              <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 p-4 dark:from-primary-900/20 dark:to-blue-900/20 dark:border-primary-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-100 p-2 dark:bg-primary-800">
                    <Crown className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="toss-body2 font-semibold text-primary-700 dark:text-primary-300">{t('pricing.trialActive')}</p>
                    <p className="toss-caption text-primary-600 dark:text-primary-400">{t('pricing.trialDaysLeft', { days: trialDaysRemaining })}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary-400" />
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* Trial Expired */}
        {isTrialExpired && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.gentle, delay: 0.03 }}>
            <Link href={`/${locale}/pricing`}>
              <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 p-4 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-800">
                    <Crown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="toss-body2 font-semibold text-orange-700 dark:text-orange-300">{t('pricing.trialExpiredBanner')}</p>
                    <p className="toss-caption text-orange-600 dark:text-orange-400">{t('pricing.trialExpiredBannerDesc')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {hasIngredients && (
          <DashboardStats
            total={stats.total}
            expiring={stats.expiring}
            safeCount={stats.safe.length}
            favoriteCount={stats.favoriteCount}
          />
        )}

        {!hasIngredients && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.gentle, delay: 0.1 }}>
            <div className="toss-card text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Refrigerator className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="toss-h3">{t('home.empty')}</h2>
              <p className="toss-body2 mt-2 text-gray-500">{t('home.emptyDescription')}</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link href={`/${locale}/scan`}>
                  <motion.button whileTap={{ scale: 0.95 }} className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white">
                    {t('home.startScan')}
                  </motion.button>
                </Link>
                <Link href={`/${locale}/fridge/add`}>
                  <motion.button whileTap={{ scale: 0.95 }} className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {t('home.addManual')}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {hasIngredients && (
          <ExpiryTimeline
            total={stats.total}
            expiredCount={stats.expired.length}
            within3Count={stats.within3.length}
            within7Count={stats.within7.length}
            safeCount={stats.safe.length}
          />
        )}

        <ExpiringAlert locale={locale} items={stats.expiringItems} />

        {/* Quick Actions - Horizontal scroll chips */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.gentle, delay: 0.2 }}>
          <h2 className="toss-h3 mb-toss-sm">{t('home.quickActions')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-toss-md px-toss-md">
            {quickActions.map((action, index) => (
              <motion.div key={action.href} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring.snappy, delay: 0.2 + index * 0.05 }}>
                <Link href={action.href} className="block">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 pl-1.5 pr-4 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                    <div className={`${action.color} rounded-full p-2 text-white`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <BannerAd className="my-2" />

        {hasIngredients && <StorageBreakdown total={stats.total} storageCount={stats.storageCount} />}

        <CategoryBreakdown total={stats.total} sortedCategories={stats.sortedCategories} />

        {/* AI Recipe Banner */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.gentle, delay: 0.35 }}>
          <Link href={`/${locale}/recommend`}>
            <motion.div whileTap={{ scale: 0.98 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-amber-500 p-toss-md text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-bold">{t('home.whatToEat')}</span>
                </div>
                <p className="mt-toss-xs text-sm text-white/80">{t('recommend.description')}</p>
              </div>
              <div className="absolute -right-4 -top-4 opacity-20">
                <ChefHat className="h-24 w-24" />
              </div>
            </motion.div>
          </Link>
        </motion.section>

        <RecentItems locale={locale} items={stats.recentItems} />

        <FeatureCards locale={locale} />
      </div>

      <TrialWelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      <TrialExpiringModal isOpen={showExpiring} onClose={() => setShowExpiring(false)} daysRemaining={trialDaysRemaining} />
    </div>
  );
}
