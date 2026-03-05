'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Crown, CreditCard, Shield, Check, Loader2, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAppsInToss } from '@/hooks/useAppsInToss';
import { IAP_PRODUCTS } from '@/types/apps-in-toss';
import type { IapProductItem } from '@/types/apps-in-toss';
import { PlanSelector } from '@/features/checkout/PlanSelector';
import { ValueProposition } from '@/features/checkout/ValueProposition';
import { OrderSummary } from '@/features/checkout/OrderSummary';

type Plan = 'monthly' | 'yearly';

function getProductPrice(products: IapProductItem[], sku: string): string | null {
  const product = products.find((p) => p.sku === sku);
  return product?.displayAmount ?? null;
}

const FALLBACK_PRICES = {
  monthly: { price: '\u20A91,980', total: '\u20A91,980' },
  yearly: { price: '\u20A91,386', total: '\u20A916,632' },
};

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

  const {
    isAvailable: isAppsInToss,
    isLoading: isAppsInTossLoading,
    products: iapProducts,
    pendingOrders,
    purchase,
    restorePendingOrders,
  } = useAppsInToss();

  useEffect(() => {
    if (isAppsInToss && pendingOrders.length > 0) {
      restorePendingOrders();
    }
  }, [isAppsInToss, pendingOrders.length, restorePendingOrders]);

  const monthlyTotal = getProductPrice(iapProducts, IAP_PRODUCTS.PREMIUM_MONTHLY) ?? FALLBACK_PRICES.monthly.total;
  const yearlyTotal = getProductPrice(iapProducts, IAP_PRODUCTS.PREMIUM_YEARLY) ?? FALLBACK_PRICES.yearly.total;

  const yearlyMonthlyPrice = (() => {
    const match = yearlyTotal.match(/[\d,]+/);
    if (match) {
      const num = parseInt(match[0].replace(/,/g, ''), 10);
      return `\u20A9${Math.round(num / 12).toLocaleString()}`;
    }
    return FALLBACK_PRICES.yearly.price;
  })();

  const plans = {
    monthly: {
      price: monthlyTotal,
      period: t('pricing.month'),
      total: monthlyTotal,
      badge: t('pricing.mostPopular'),
    },
    yearly: {
      price: yearlyMonthlyPrice,
      period: t('pricing.month'),
      total: yearlyTotal,
      badge: t('pricing.bestValue'),
      discount: '30%',
    },
  };

  const premiumFeatures = [
    { icon: '\uD83D\uDCF8', text: t('pricing.feature.unlimitedScan') },
    { icon: '\uD83E\uDD16', text: t('pricing.feature.aiRecipe') },
    { icon: '\uD83D\uDCCA', text: t('pricing.feature.nutritionAnalysis') },
    { icon: '\uD83D\uDED2', text: t('pricing.feature.smartShopping') },
    { icon: '\uD83D\uDD0D', text: t('pricing.feature.externalSearch') },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    if (isAppsInToss) {
      const sku = selectedPlan === 'yearly' ? IAP_PRODUCTS.PREMIUM_YEARLY : IAP_PRODUCTS.PREMIUM_MONTHLY;
      const result = await purchase(sku);

      if (result.type === 'success') {
        setIsComplete(true);
      } else {
        switch (result.errorCode) {
          case 'USER_CANCELED': break;
          case 'NETWORK_ERROR': setError(t('pricing.error.network')); break;
          case 'PRODUCT_NOT_GRANTED_BY_PARTNER': setError(t('pricing.error.grantFailed')); break;
          default: setError(result.errorMessage || t('pricing.error.unknown'));
        }
      }
      setIsProcessing(false);
      return;
    }

    setError(t('pricing.error.openInToss'));
    setIsProcessing(false);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">{t('pricing.success')}</h2>
          <p className="mb-8 text-gray-500">{t('pricing.successDescription')}</p>
          <Button onClick={() => router.push(`/${locale}`)}>{t('common.confirm')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="space-y-6 p-4">
        <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} plans={plans} />

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t('pricing.premiumBenefits')}
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

        <ValueProposition monthlyTotal={plans.monthly.total} />

        {/* AI Recipe Highlight */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('recommend.aiMode')}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('pricing.feature.aiRecipeDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <OrderSummary
          selectedPlan={selectedPlan}
          plans={plans}
          monthlyTotal={monthlyTotal}
          yearlyTotal={yearlyTotal}
        />

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

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isAppsInTossLoading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">{t('checkout.checkingPayment')}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing || isAppsInTossLoading}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('pricing.processing')}</>
            ) : (
              <><Crown className="mr-2 h-5 w-5" />{t('checkout.payAmount', { amount: plans[selectedPlan].total })}</>
            )}
          </Button>

          {isAppsInToss && (
            <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              {t('checkout.tossPay')}
            </div>
          )}

          <p className="text-center text-xs text-gray-500">{t('pricing.cancelDescription')}</p>
          <p className="text-center text-xs text-gray-400">{t('pricing.terms')}</p>
        </div>

        <Button variant="ghost" onClick={() => router.back()} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('checkout.goBack')}
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
