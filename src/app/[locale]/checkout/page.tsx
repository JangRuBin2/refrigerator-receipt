'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Crown, CreditCard, Shield, Check, Loader2, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { IAP_PRODUCTS } from '@/types/apps-in-toss';

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
  const [error, setError] = useState<string | null>(null);

  // 앱인토스 SDK
  const {
    isAvailable: isAppsInToss,
    isLoading: isAppsInTossLoading,
    products: iapProducts,
    pendingOrders,
    purchase,
    restorePendingOrders,
  } = useAppsInToss();

  // 미결 주문 복원 시도
  useEffect(() => {
    if (isAppsInToss && pendingOrders.length > 0) {
      restorePendingOrders();
    }
  }, [isAppsInToss, pendingOrders.length, restorePendingOrders]);

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
    setError(null);

    // 앱인토스 환경에서는 인앱결제 사용
    if (isAppsInToss) {
      const sku = selectedPlan === 'yearly'
        ? IAP_PRODUCTS.PREMIUM_YEARLY
        : IAP_PRODUCTS.PREMIUM_MONTHLY;

      const result = await purchase(sku);

      if (result.type === 'success') {
        setIsComplete(true);
      } else {
        // 에러 처리
        switch (result.errorCode) {
          case 'USER_CANCELED':
            // 사용자 취소는 에러 메시지 표시 안함
            break;
          case 'NETWORK_ERROR':
            setError(t('pricing.error.network'));
            break;
          case 'PRODUCT_NOT_GRANTED_BY_PARTNER':
            setError(t('pricing.error.grantFailed'));
            break;
          default:
            setError(result.errorMessage || t('pricing.error.unknown'));
        }
      }

      setIsProcessing(false);
      return;
    }

    // 앱인토스 환경이 아닌 경우 (웹 브라우저)
    // 토스 앱에서 열도록 안내
    setError(t('pricing.error.openInToss'));
    setIsProcessing(false);
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

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* AppsInToss Loading */}
        {isAppsInTossLoading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">결제 환경 확인 중...</span>
          </div>
        )}

        {/* Subscribe Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing || isAppsInTossLoading}
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

          {/* 앱인토스 환경 표시 */}
          {isAppsInToss && (
            <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              토스페이로 결제됩니다
            </div>
          )}

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
