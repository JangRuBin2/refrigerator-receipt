'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Check, Crown, Zap, Camera, Search, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function PricingPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const freePlan = [
    t('pricing.feature.manualAdd'),
    t('pricing.feature.fridgeManage'),
    t('pricing.feature.expiryAlert'),
    t('pricing.feature.recipeView'),
    t('pricing.feature.menuRecommend'),
  ];

  const premiumPlan = [
    t('pricing.feature.receiptScan'),
    t('pricing.feature.externalSearch'),
    t('pricing.feature.allFreeFeatures'),
  ];

  return (
    <div className="min-h-screen">
      <Header locale={locale} title={t('pricing.title')} />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('pricing.heading')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('pricing.subheading')}
          </p>
        </div>

        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gray-500" />
              {t('pricing.freePlan')}
            </CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('pricing.free')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {freePlan.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" disabled>
              {t('pricing.currentPlan')}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-2 border-primary-500 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="info" className="bg-primary-500 px-3 py-1 text-white">
              {t('pricing.recommended')}
            </Badge>
          </div>
          <CardHeader className="pt-6">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t('pricing.premiumPlan')}
            </CardTitle>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('pricing.monthlyPrice')}
              </span>
              <span className="text-sm text-gray-500">
                / {t('pricing.month')}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {t('pricing.yearlyPrice')}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {premiumPlan.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <Button className="w-full" disabled>
                <Crown className="mr-2 h-4 w-4" />
                {t('pricing.comingSoon')}
              </Button>
              <p className="text-center text-xs text-gray-400">
                {t('pricing.comingSoonDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pricing.comparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { feature: t('pricing.feature.manualAdd'), free: true, premium: true },
                { feature: t('pricing.feature.fridgeManage'), free: true, premium: true },
                { feature: t('pricing.feature.expiryAlert'), free: true, premium: true },
                { feature: t('pricing.feature.recipeView'), free: true, premium: true },
                { feature: t('pricing.feature.menuRecommend'), free: true, premium: true },
                { feature: t('pricing.feature.receiptScan'), free: false, premium: true },
                { feature: t('pricing.feature.externalSearch'), free: false, premium: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm">{row.feature}</span>
                  <div className="flex gap-8">
                    <div className="w-12 text-center">
                      {row.free ? (
                        <Check className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="w-12 text-center">
                      <Check className="mx-auto h-4 w-4 text-primary-500" />
                    </div>
                  </div>
                </div>
              ))}
              {/* Column headers */}
              <div className="flex items-center justify-end pb-2 pt-0 text-xs text-gray-400">
                <div className="flex gap-8">
                  <span className="w-12 text-center">Free</span>
                  <span className="w-12 text-center">Premium</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
