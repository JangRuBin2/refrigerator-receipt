'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { PREMIUM_FEATURES, type PremiumFeature } from '@/hooks/usePremium';
import { featureIcons, featureKeys } from '@/components/premium/PremiumModal';
import type { SubscriptionResponse } from '@/types/subscription';

interface PremiumStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  subscription: SubscriptionResponse | null;
}

export function PremiumStatusSheet({ isOpen, onClose, locale, subscription }: PremiumStatusSheetProps) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('settings.premiumServices')} snapPoints={[60]}>
      <div className="space-y-5">
        <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
          <h3 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            {t('settings.subscriptionStatus')}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('settings.planName')}</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {t('pricing.premiumPlan')}
                {subscription?.billingCycle === 'yearly'
                  ? ` (${t('settings.billingYearly')})`
                  : subscription?.billingCycle === 'monthly'
                    ? ` (${t('settings.billingMonthly')})`
                    : ''}
              </span>
            </div>
            {subscription?.expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('settings.expiresAt')}</span>
                <span className="font-medium">
                  {new Date(subscription.expiresAt).toLocaleDateString(locale)}
                </span>
              </div>
            )}
            <div className="mt-2 rounded bg-amber-100/60 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-800/30 dark:text-amber-400">
              {t('settings.manualRenewNotice')}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">{t('settings.premiumFeatures')}</h3>
          <div className="space-y-2">
            {(Object.entries(PREMIUM_FEATURES) as [PremiumFeature, boolean][]).map(([feature, isPremiumFeature]) => (
              <div
                key={feature}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 [&>svg]:h-4 [&>svg]:w-4">
                    {featureIcons[feature]}
                  </div>
                  <span className="text-sm font-medium">
                    {t(`pricing.feature.${featureKeys[feature]}`)}
                  </span>
                </div>
                {isPremiumFeature && <Check className="h-5 w-5 text-green-500" />}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            onClose();
            router.push(`/${locale}/pricing`);
          }}
          variant="outline"
          className="w-full"
        >
          {t('settings.managePlan')}
        </Button>
      </div>
    </BottomSheet>
  );
}
