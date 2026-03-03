'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePremium, type PremiumFeature } from '@/hooks/usePremium';
import { createClient } from '@/lib/supabase/client';
import { PremiumModal } from './PremiumModal';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const params = useParams();
  const locale = params.locale as string;
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isLoading, checkPremiumAccess, isTrialExpired } = usePremium();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/${locale}/login/`;
        return;
      }

      setIsAuthenticated(true);
      setIsAuthChecking(false);
    };
    checkAuth();
  }, [locale]);

  if (isAuthChecking || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

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
