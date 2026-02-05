'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { getDaysUntilExpiry } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { listContainer, listItem, spring } from '@/lib/animations';
import {
  AlertTriangle,
  Camera,
  ChefHat,
  ChevronRight,
  Refrigerator,
  ShoppingCart,
  Sparkles,
  Activity,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function HomePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const { ingredients } = useStore();

  // Get current date
  const today = new Date();
  const dateString = today.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Get expiring items (within 3 days)
  const expiringItems = ingredients
    .map((item) => ({
      ...item,
      daysLeft: getDaysUntilExpiry(item.expiryDate),
    }))
    .filter((item) => item.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // Get recent items (last 10 added)
  const recentItems = [...ingredients]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 10);

  const quickActions = [
    { icon: Camera, label: t('home.scanReceipt'), href: `/${locale}/scan`, color: 'bg-primary-500' },
    { icon: Refrigerator, label: t('nav.fridge'), href: `/${locale}/fridge`, color: 'bg-blue-500' },
    { icon: ChefHat, label: t('nav.recipes'), href: `/${locale}/recipes`, color: 'bg-amber-500' },
    { icon: ShoppingCart, label: t('shopping.title'), href: `/${locale}/shopping`, color: 'bg-teal-500' },
  ];

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

        {/* Expiring Alert Card - Single Focus */}
        {expiringItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 }}
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
                      {expiringItems.length}{t('home.itemsExpiringSoon', { count: expiringItems.length })}
                    </p>

                    {/* Horizontal scroll items */}
                    <div className="mt-toss-sm flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {expiringItems.map((item) => (
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

        {/* Quick Actions - Icon Buttons */}
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

        {/* AI Recipe Recommendation Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.3 }}
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

        {/* Recent Items - Horizontal Scroll */}
        {recentItems.length > 0 && (
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
              {recentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={listItem}
                  className="flex-shrink-0"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="toss-card w-32 text-center">
                    <p className="toss-body2 font-medium truncate">{item.name}</p>
                    <p className="toss-caption mt-1">
                      {item.quantity} {t(`units.${item.unit}`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Feature Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.5 }}
          className="space-y-toss-sm"
        >
          {/* Nutrition Analysis */}
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
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </motion.div>
          </Link>

          {/* Shopping List */}
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
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </motion.div>
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
