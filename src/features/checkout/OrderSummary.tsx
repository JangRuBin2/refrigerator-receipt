'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

type Plan = 'monthly' | 'yearly';

interface PlanInfo {
  price: string;
  period: string;
  total: string;
}

interface OrderSummaryProps {
  selectedPlan: Plan;
  plans: Record<Plan, PlanInfo>;
  monthlyTotal: string;
  yearlyTotal: string;
}

export function OrderSummary({ selectedPlan, plans, monthlyTotal, yearlyTotal }: OrderSummaryProps) {
  const t = useTranslations();

  const discountAmount = (() => {
    if (selectedPlan !== 'yearly') return null;
    const mMatch = monthlyTotal.match(/[\d,]+/);
    const yMatch = yearlyTotal.match(/[\d,]+/);
    if (mMatch && yMatch) {
      const mNum = parseInt(mMatch[0].replace(/,/g, ''), 10);
      const yNum = parseInt(yMatch[0].replace(/,/g, ''), 10);
      const discount = mNum * 12 - yNum;
      return discount > 0 ? discount : null;
    }
    return null;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('checkout.orderSummary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Premium {selectedPlan === 'monthly' ? t('settings.billingMonthly') : t('settings.billingYearly')}
          </span>
          <span className="font-medium">{plans[selectedPlan].total}</span>
        </div>
        {discountAmount !== null && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t('checkout.discount')}</span>
            <span>-₩{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between font-semibold">
            <span>{t('checkout.totalAmount')}</span>
            <span className="text-primary-600">{plans[selectedPlan].total}</span>
          </div>
          {selectedPlan === 'yearly' && (
            <p className="mt-1 text-right text-xs text-gray-500">
              ({plans[selectedPlan].price}/{t('pricing.month')})
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
