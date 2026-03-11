'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Check, Crown, Zap, X, Sparkles, BarChart3, Camera, Play } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const comparisonFeatures = [
    { feature: t('pricing.feature.manualAdd'), free: true, ad: true, premium: true },
    { feature: t('pricing.feature.fridgeManage'), free: true, ad: true, premium: true },
    { feature: t('pricing.feature.expiryAlert'), free: true, ad: true, premium: true },
    { feature: t('pricing.feature.recipeView'), free: true, ad: true, premium: true },
    { feature: t('pricing.feature.menuRecommend'), free: true, ad: true, premium: true },
    { feature: t('pricing.feature.receiptScan'), free: false, ad: true, premium: true },
    { feature: t('pricing.feature.aiRecipe'), free: false, ad: true, premium: true },
    { feature: t('pricing.feature.nutritionAnalysis'), free: false, ad: false, premium: true },
    { feature: t('pricing.feature.aiShopping'), free: false, ad: true, premium: true },
    { feature: t('pricing.feature.noAds'), free: false, ad: false, premium: true },
  ];

  return (
    <div className="min-h-screen">
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
              {[
                t('pricing.feature.manualAdd'),
                t('pricing.feature.fridgeManage'),
                t('pricing.feature.recipeView'),
                t('pricing.feature.menuRecommend'),
                t('pricing.feature.expiryAlert'),
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" disabled>
              {t('pricing.currentPlan')}
            </Button>
          </CardContent>
        </Card>

        {/* Ad Reward Features */}
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              {t('pricing.adReward')}
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">{t('pricing.adRewardDesc')}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Camera, text: t('pricing.feature.receiptScan'), color: 'text-teal-500' },
                { icon: Sparkles, text: t('pricing.feature.aiRecipe'), color: 'text-purple-500' },
                { icon: BarChart3, text: t('pricing.feature.aiShopping'), color: 'text-orange-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <item.icon className={cn('h-5 w-5', item.color)} />
                  <span className="text-sm font-medium">{item.text}</span>
                  <Badge variant="info" className="ml-auto text-xs">{t('pricing.adWatch')}</Badge>
                </div>
              ))}
            </div>
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
              <li className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="font-medium">{t('pricing.feature.allFreeFeatures')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="font-medium">{t('pricing.feature.noAds')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="font-medium">{t('pricing.feature.nutritionAnalysis')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="font-medium">{t('pricing.premiumExclusive')}</span>
              </li>
            </ul>
            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/${locale}/checkout?plan=monthly`)}
              >
                <Crown className="mr-2 h-4 w-4" />
                {t('pricing.subscribeMonthly')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/${locale}/checkout?plan=yearly`)}
              >
                {t('pricing.subscribeYearly')} (30% {t('checkout.discount')})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pricing.comparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end pb-3 text-xs font-medium text-gray-500">
              <div className="flex gap-4">
                <span className="w-12 text-center">Free</span>
                <span className="w-12 text-center text-blue-600">{t('pricing.adShort')}</span>
                <span className="w-12 text-center text-primary-600">Premium</span>
              </div>
            </div>
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {comparisonFeatures.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="flex-1 pr-2 text-sm">{row.feature}</span>
                  <div className="flex gap-4">
                    <div className="w-12 text-center">
                      {row.free ? (
                        <Check className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="w-12 text-center">
                      {row.ad ? (
                        <Check className="mx-auto h-4 w-4 text-blue-500" />
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
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <CardContent className="p-6 text-center">
            <Crown className="mx-auto h-10 w-10" />
            <h3 className="mt-3 text-xl font-bold">{t('pricing.startPremium')}</h3>
            <p className="mt-2 text-sm text-white/80">
              {t('pricing.premiumCtaDesc')}
            </p>
            <Button
              variant="secondary"
              className="mt-4 bg-white text-primary-600 hover:bg-gray-100"
              onClick={() => router.push(`/${locale}/checkout?plan=yearly`)}
            >
              {t('pricing.subscribeYearly')} (30% {t('checkout.discount')})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
