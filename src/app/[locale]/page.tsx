'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Camera, AlertTriangle, Sparkles, ShoppingCart, Activity } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import { getDaysUntilExpiry, getExpiryColor } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function HomePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const { ingredients } = useStore();

  // Get expiring items (within 3 days)
  const expiringItems = ingredients
    .map((item) => ({
      ...item,
      daysLeft: getDaysUntilExpiry(item.expiryDate),
    }))
    .filter((item) => item.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <Header locale={locale} />

      <div className="space-y-6 p-4">
        {/* Welcome Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('home.welcome')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('common.appName')}
          </p>
        </div>

        {/* Scan Receipt Card */}
        <Link href={`/${locale}/scan`}>
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white transition-transform hover:scale-[1.02]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-white/20 p-3">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('home.scanReceipt')}</h3>
                <p className="text-sm text-white/80">{t('home.scanDescription')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Expiring Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('home.expiringItems')}
            </CardTitle>
            {expiringItems.length > 0 && (
              <Link
                href={`/${locale}/fridge`}
                className="text-sm text-primary-600 hover:underline"
              >
                {t('home.viewAll')}
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {expiringItems.length === 0 ? (
              <p className="py-4 text-center text-gray-500">{t('home.noExpiring')}</p>
            ) : (
              <div className="space-y-2">
                {expiringItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                  >
                    <span className="font-medium">{item.name}</span>
                    <Badge
                      variant={
                        item.daysLeft < 0
                          ? 'danger'
                          : item.daysLeft === 0
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {item.daysLeft < 0
                        ? t('fridge.expired')
                        : item.daysLeft === 0
                        ? t('fridge.today')
                        : t('fridge.dDay', { days: item.daysLeft })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* What to Eat Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {t('home.whatToEat')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/recommend`}>
              <Button
                className="h-20 w-full flex-col gap-2 bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600"
                size="lg"
              >
                <Sparkles className="h-6 w-6" />
                <span>{t('recommend.title')}</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Shopping List */}
        <Link href={`/${locale}/shopping`}>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-transform hover:scale-[1.02]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-white/20 p-3">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('shopping.title')}</h3>
                <p className="text-sm text-white/80">{t('home.shoppingDescription')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Nutrition Analysis */}
        <Link href={`/${locale}/nutrition`}>
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-transform hover:scale-[1.02]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-white/20 p-3">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('nutrition.title')}</h3>
                <p className="text-sm text-white/80">{t('home.nutritionDescription')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('home.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/${locale}/fridge`}>
                <Button variant="secondary" className="w-full">
                  {t('nav.fridge')}
                </Button>
              </Link>
              <Link href={`/${locale}/recipes`}>
                <Button variant="secondary" className="w-full">
                  {t('nav.recipes')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
