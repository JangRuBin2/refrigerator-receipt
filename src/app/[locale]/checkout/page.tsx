'use client';

import { useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Crown, CreditCard, Shield, Check, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Plan = 'monthly' | 'yearly';

function CheckoutContent() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const initialPlan = searchParams.get('plan') as Plan || 'monthly';
  const [selectedPlan, setSelectedPlan] = useState<Plan>(initialPlan);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const plans = {
    monthly: {
      price: '₩3,900',
      period: t('pricing.month'),
      total: '₩3,900',
      badge: t('pricing.mostPopular'),
    },
    yearly: {
      price: '₩2,825',
      period: t('pricing.month'),
      total: '₩33,900',
      badge: t('pricing.bestValue'),
      discount: '28%',
    },
  };

  const premiumFeatures = [
    { icon: '📸', text: t('pricing.feature.unlimitedScan') },
    { icon: '🤖', text: t('pricing.feature.aiRecipe') },
    { icon: '📊', text: t('pricing.feature.nutritionAnalysis') },
    { icon: '🛒', text: t('pricing.feature.smartShopping') },
    { icon: '♻️', text: t('pricing.feature.wasteAnalysis') },
    { icon: '🔍', text: t('pricing.feature.externalSearch') },
    { icon: '🚫', text: t('pricing.feature.noAds') },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);

    // TODO: 실제 결제 연동 (Stripe/토스페이먼츠)
    // 현재는 데모용 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen">
        <Header locale={locale} title={t('pricing.title')} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">{t('pricing.success')}</h2>
          <p className="mb-8 text-gray-500">{t('pricing.successDescription')}</p>
          <Button onClick={() => router.push(`/${locale}`)}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header locale={locale} title={t('pricing.subscribe')} />

      <div className="space-y-6 p-4">
        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-3">
          {(['monthly', 'yearly'] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={cn(
                'relative rounded-xl border-2 p-4 text-left transition-all',
                selectedPlan === plan
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
            >
              {plans[plan].badge && (
                <Badge
                  variant={plan === 'yearly' ? 'success' : 'info'}
                  className="absolute -top-2 right-2 text-xs"
                >
                  {plans[plan].badge}
                </Badge>
              )}
              <p className="text-sm font-medium text-gray-500">
                {plan === 'monthly' ? '월간' : '연간'}
              </p>
              <p className="mt-1 text-xl font-bold">
                {plans[plan].price}
                <span className="text-sm font-normal text-gray-500">/{plans[plan].period}</span>
              </p>
              {plan === 'yearly' && (
                <p className="mt-1 text-xs text-green-600">
                  {plans[plan].discount} 할인
                </p>
              )}
              {selectedPlan === plan && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-yellow-500" />
              프리미엄 혜택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{feature.icon}</span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* AI Recipe Highlight */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">AI 맞춤 레시피</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t('pricing.feature.aiRecipeDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">결제 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Premium {selectedPlan === 'monthly' ? '월간' : '연간'}
              </span>
              <span className="font-medium">{plans[selectedPlan].total}</span>
            </div>
            {selectedPlan === 'yearly' && (
              <div className="flex justify-between text-sm text-green-600">
                <span>할인</span>
                <span>-₩12,900</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>총 결제 금액</span>
                <span className="text-primary-600">{plans[selectedPlan].total}</span>
              </div>
              {selectedPlan === 'yearly' && (
                <p className="mt-1 text-right text-xs text-gray-500">
                  (월 {plans[selectedPlan].price})
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              {t('pricing.paymentMethod')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button className="flex w-full items-center justify-between rounded-lg border-2 border-primary-500 bg-primary-50 p-4 dark:bg-primary-900/20">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="font-medium">{t('pricing.card')}</span>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                <Check className="h-3 w-3 text-white" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <Shield className="h-5 w-5 text-green-600" />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium">{t('pricing.securePayment')}</p>
            <p>{t('pricing.secureDescription')}</p>
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('pricing.processing')}
              </>
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" />
                {plans[selectedPlan].total} 결제하기
              </>
            )}
          </Button>
          <p className="text-center text-xs text-gray-500">
            {t('pricing.cancelDescription')}
          </p>
          <p className="text-center text-xs text-gray-400">
            {t('pricing.terms')}
          </p>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
      </div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
