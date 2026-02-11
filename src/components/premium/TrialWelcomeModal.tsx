'use client';

import { useTranslations } from 'next-intl';
import { Gift, Refrigerator, Camera, UtensilsCrossed, BarChart3, ShoppingCart, Sparkles, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface TrialWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRIAL_FEATURES = [
  { icon: Refrigerator, color: 'text-blue-500' },
  { icon: Camera, color: 'text-teal-500' },
  { icon: UtensilsCrossed, color: 'text-amber-500' },
  { icon: BarChart3, color: 'text-green-500' },
  { icon: ShoppingCart, color: 'text-orange-500' },
  { icon: Sparkles, color: 'text-purple-500' },
] as const;

const FEATURE_KEYS = [
  'fridgeManagement',
  'unlimitedScan',
  'recipeBrowsing',
  'nutritionAnalysis',
  'smartShopping',
  'aiRecipe',
] as const;

export function TrialWelcomeModal({ isOpen, onClose }: TrialWelcomeModalProps) {
  const t = useTranslations();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-sm">
      <div className="text-center">
        {/* Gift Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30">
          <Gift className="h-8 w-8 text-primary-600" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          {t('pricing.trialWelcomeTitle')}
        </h2>

        {/* Description */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t('pricing.trialWelcomeDescription')}
        </p>

        {/* Feature List */}
        <div className="mb-6 space-y-2 text-left">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t('pricing.trialWelcomeFeatures')}
          </p>
          <ul className="space-y-2">
            {TRIAL_FEATURES.map((feature, i) => (
              <li key={FEATURE_KEYS[i]} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                </div>
                <span className="flex-1 text-sm font-medium">
                  {t(`pricing.feature.${FEATURE_KEYS[i]}`)}
                </span>
                <Check className="h-4 w-4 text-green-500" />
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button onClick={onClose} className="w-full" size="lg">
          {t('pricing.getStarted')}
        </Button>
      </div>
    </Modal>
  );
}
