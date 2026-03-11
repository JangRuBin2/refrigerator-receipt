'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { AdWatchingOverlay } from '@/components/ads/AdWatchingOverlay';
import { BannerAd } from '@/components/ads/BannerAd';
import { usePremiumAction } from '@/hooks/usePremiumAction';
import { ModeSelector, RandomMode, TasteMode, AiRecipeMode } from '@/features/recommend';
import type { Mode } from '@/features/recommend';

export default function RecommendPage() {
  const params = useParams();
  const locale = String(params.locale ?? 'ko');
  const { isPremium } = usePremium();
  const { executeWithPremiumCheck, showPremiumModal, closePremiumModal, isWatchingAd } = usePremiumAction();

  const [mode, setMode] = useState<Mode>('select');

  const handleAiModeClick = () => {
    executeWithPremiumCheck(() => {
      setMode('ai');
    });
  };

  const goBack = () => setMode('select');

  return (
    <>
    <AdWatchingOverlay isVisible={isWatchingAd} />
    <PremiumModal isOpen={showPremiumModal} onClose={closePremiumModal} feature="ai_recipe" />
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
      </div>
    </div>
    </>
  );
}
