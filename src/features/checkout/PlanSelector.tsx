'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Plan = 'monthly' | 'yearly';

interface PlanInfo {
  price: string;
  period: string;
  total: string;
  badge: string;
  discount?: string;
}

interface PlanSelectorProps {
  selectedPlan: Plan;
  onSelect: (plan: Plan) => void;
  plans: Record<Plan, PlanInfo>;
}

export function PlanSelector({ selectedPlan, onSelect, plans }: PlanSelectorProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-3">
      {(['monthly', 'yearly'] as const).map((plan) => (
        <button
          key={plan}
          onClick={() => onSelect(plan)}
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
            {plan === 'monthly' ? t('settings.billingMonthly') : t('settings.billingYearly')}
          </p>
          <p className="mt-1 text-xl font-bold">
            {plans[plan].price}
            <span className="text-sm font-normal text-gray-500">/{plans[plan].period}</span>
          </p>
          {plan === 'yearly' && plans[plan].discount && (
            <p className="mt-1 text-xs text-green-600">
              {plans[plan].discount} {t('checkout.discount')}
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
  );
}
