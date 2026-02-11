'use client';

import { usePremium, type PremiumFeature } from '@/hooks/usePremium';
import { PremiumModal } from './PremiumModal';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const { isPremium, isLoading, checkPremiumAccess, isTrialExpired } = usePremium();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const hasAccess = checkPremiumAccess(feature);

  if (!hasAccess) {
    return (
      <PremiumModal
        isOpen={true}
        onClose={() => {
          window.history.back();
        }}
        feature={feature}
        variant={isTrialExpired ? 'trial_expired' : 'non_subscriber'}
      />
    );
  }

  return <>{children}</>;
}
