'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { BannerAd } from '@/components/ads/BannerAd';
import { ModeSelector, RandomMode, TasteMode, AiRecipeMode } from '@/features/recommend';
import type { Mode } from '@/features/recommend';

export default function RecommendPage() {
  const params = useParams();
  const locale = String(params.locale ?? 'ko');
  const { isPremium } = usePremium();

  const [mode, setMode] = useState<Mode>('select');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [, setFreeTrialInfo] = useState<{ remainingCount: number; limit: number } | null>(null);

  const handleAiModeClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setMode('ai');
  };

  const goBack = () => setMode('select');

  return (
    <div className="min-h-screen">
      <div className="space-y-4 p-4 pb-8">
        {mode === 'select' && (
          <ModeSelector
            isPremium={isPremium}
            onSelectMode={setMode}
            onAiModeClick={handleAiModeClick}
          />
        )}

        {mode === 'random' && (
          <RandomMode locale={locale} onBack={goBack} />
        )}

        {mode === 'taste' && (
          <TasteMode locale={locale} onBack={goBack} />
        )}

        {mode === 'ai' && (
          <AiRecipeMode locale={locale} isPremium={isPremium} onBack={goBack} />
        )}

        <BannerAd className="mt-2" />

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature="ai_recipe"
        />
      </div>
    </div>
  );
}
