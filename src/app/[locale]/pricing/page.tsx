'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Check, Crown, Zap, X, Sparkles, BarChart3, ShoppingCart, Camera, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const freePlan = [
    { text: t('pricing.feature.manualAdd'), included: true },
    { text: t('pricing.feature.fridgeManage'), included: true },
    { text: t('pricing.feature.expiryAlert'), included: true },
    { text: t('pricing.feature.recipeView'), included: true },
    { text: t('pricing.feature.menuRecommend'), included: true },
  ];

  const premiumFeatures = [
    {
      icon: Camera,
      title: t('pricing.feature.unlimitedScan'),
      description: '카메라/갤러리로 영수증 촬영하여 자동 식재료 등록',
      color: 'text-blue-500',
    },
    {
      icon: Sparkles,
      title: t('pricing.feature.aiRecipe'),
      description: t('pricing.feature.aiRecipeDesc'),
      color: 'text-purple-500',
      highlight: true,
    },
    {
      icon: BarChart3,
      title: t('pricing.feature.nutritionAnalysis'),
      description: t('pricing.feature.nutritionDesc'),
      color: 'text-green-500',
    },
    {
      icon: ShoppingCart,
      title: t('pricing.feature.smartShopping'),
      description: t('pricing.feature.smartShoppingDesc'),
      color: 'text-orange-500',
    },
    {
      icon: Search,
      title: t('pricing.feature.externalSearch'),
      description: 'YouTube, Google에서 레시피 검색',
      color: 'text-red-500',
    },
  ];

  const comparisonFeatures = [
    { feature: t('pricing.feature.manualAdd'), free: true, premium: true },
    { feature: t('pricing.feature.fridgeManage'), free: true, premium: true },
    { feature: t('pricing.feature.expiryAlert'), free: true, premium: true },
    { feature: t('pricing.feature.recipeView'), free: true, premium: true },
    { feature: t('pricing.feature.menuRecommend'), free: true, premium: true },
    { feature: t('pricing.feature.unlimitedScan'), free: false, premium: true },
    { feature: t('pricing.feature.aiRecipe'), free: false, premium: true },
    { feature: t('pricing.feature.nutritionAnalysis'), free: false, premium: true },
    { feature: t('pricing.feature.smartShopping'), free: false, premium: true },
    { feature: t('pricing.feature.externalSearch'), free: false, premium: true },
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
              {freePlan.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>{item.text}</span>
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
              <li className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="font-medium">{t('pricing.feature.allFreeFeatures')}</span>
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
                {t('pricing.subscribeYearly')} (30% 할인)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features Showcase */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            프리미엄 전용 기능
          </h3>
          {premiumFeatures.map((feature, i) => (
            <Card
              key={i}
              className={cn(
                feature.highlight && 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    feature.highlight ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <feature.icon className={cn('h-5 w-5', feature.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{feature.title}</h4>
                      {feature.highlight && (
                        <Badge variant="info" className="bg-purple-500 text-xs text-white">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pricing.comparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Column headers */}
            <div className="flex items-center justify-end pb-3 text-xs font-medium text-gray-500">
              <div className="flex gap-6">
                <span className="w-14 text-center">Free</span>
                <span className="w-14 text-center text-primary-600">Premium</span>
              </div>
            </div>
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
              {comparisonFeatures.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="flex-1 pr-4 text-sm">{row.feature}</span>
                  <div className="flex gap-6">
                    <div className="w-14 text-center">
                      {row.free ? (
                        <Check className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="w-14 text-center">
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
            <h3 className="mt-3 text-xl font-bold">지금 프리미엄 시작하기</h3>
            <p className="mt-2 text-sm text-white/80">
              AI 맞춤 레시피, 영양 분석, 스마트 장보기까지
            </p>
            <Button
              variant="secondary"
              className="mt-4 bg-white text-primary-600 hover:bg-gray-100"
              onClick={() => router.push(`/${locale}/checkout?plan=yearly`)}
            >
              연간 구독으로 30% 절약
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
