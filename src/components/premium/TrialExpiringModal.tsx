'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Crown, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface TrialExpiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
}

const DISMISS_KEY = 'mk_trial_expiring_dismissed';

export function dismissTrialExpiringForToday() {
  const today = new Date().toISOString().split('T')[0];
  try {
    localStorage.setItem(DISMISS_KEY, today);
  } catch {
    // localStorage unavailable
  }
}

export function isTrialExpiringDismissedToday(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const today = new Date().toISOString().split('T')[0];
    return dismissed === today;
  } catch {
    return false;
  }
}

export function TrialExpiringModal({ isOpen, onClose, daysRemaining }: TrialExpiringModalProps) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const handleUpgrade = () => {
    onClose();
    router.push(`/${locale}/pricing`);
  };

  const handleLater = () => {
    dismissTrialExpiringForToday();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleLater} title="" className="max-w-sm">
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
          <Clock className="h-8 w-8 text-orange-500" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {t('pricing.trialExpiringTitle')}
        </h2>

        {/* Days remaining badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          <AlertTriangle className="h-4 w-4" />
          {t('pricing.trialDaysLeft', { days: daysRemaining })}
        </div>

        {/* Description */}
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          {t('pricing.trialExpiringDescription', { days: daysRemaining })}
        </p>
        <p className="mb-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          {t('pricing.trialExpiringFreeOnly')}
        </p>

        {/* Price reminder */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-primary-600">
            {t('pricing.monthlyPrice')}
            <span className="text-sm font-normal text-gray-500">/{t('pricing.month')}</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <Button onClick={handleUpgrade} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            {t('pricing.startPremium')}
          </Button>
          <Button variant="ghost" onClick={handleLater} className="w-full">
            {t('pricing.later')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
