'use client';

import { useTranslations } from 'next-intl';
import { TrendingDown, Percent, Coffee } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ValuePropositionProps {
  monthlyTotal: string;
}

export function ValueProposition({ monthlyTotal }: ValuePropositionProps) {
  const t = useTranslations();

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
          <TrendingDown className="h-5 w-5" />
          {t('pricing.value.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
            <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('pricing.value.wasteReduction')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('pricing.value.wasteDetail')} <span className="font-semibold text-green-600">{t('pricing.value.wasteSaving')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
            <Coffee className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t('pricing.value.coffeePrice')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('pricing.value.coffeeDetail')}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('pricing.value.expectedSaving')}</span>
            <span className="font-bold text-green-600">{t('pricing.value.monthlySaving')}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('pricing.value.premiumCost')}</span>
            <span className="font-bold text-gray-900 dark:text-white">{monthlyTotal}</span>
          </div>
          <div className="mt-2 border-t pt-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t('pricing.value.netBenefit')}</span>
              <span className="font-bold text-green-600">{t('pricing.value.monthlyNet')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
