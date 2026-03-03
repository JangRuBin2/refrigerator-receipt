'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Shuffle, Sparkles, Crown, Wand2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { RandomMode } from './components/RandomMode';
import { TasteMode } from './components/TasteMode';
import { AiMode } from './components/AiMode';

type Mode = 'select' | 'random' | 'taste' | 'ai';

export default function RecommendPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'ko';
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

  return (
    <div className="min-h-screen">
      <div className="space-y-4 p-4">
        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer bg-gradient-to-br from-orange-50 to-red-50 transition-transform hover:scale-[1.02] dark:from-orange-900/20 dark:to-red-900/20"
              onClick={() => setMode('random')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Shuffle className="h-7 w-7 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('recommend.randomMode')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('recommend.randomDescription')}</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer bg-gradient-to-br from-purple-50 to-blue-50 transition-transform hover:scale-[1.02] dark:from-purple-900/20 dark:to-blue-900/20"
              onClick={() => setMode('taste')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Sparkles className="h-7 w-7 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('recommend.tasteMode')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('recommend.tasteDescription')}</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="relative cursor-pointer bg-gradient-to-br from-emerald-50 to-cyan-50 transition-transform hover:scale-[1.02] dark:from-emerald-900/20 dark:to-cyan-900/20"
              onClick={handleAiModeClick}
            >
              {!isPremium && (
                <div className="absolute right-3 top-3">
                  <Badge variant="warning" className="text-xs">
                    <Crown className="mr-1 h-3 w-3" />
                    Premium
                  </Badge>
                </div>
              )}
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Wand2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('recommend.aiMode')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('recommend.aiDescription')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === 'random' && (
          <RandomMode locale={locale} onBack={() => setMode('select')} />
        )}

        {mode === 'taste' && (
          <TasteMode locale={locale} onBack={() => setMode('select')} />
        )}

        {mode === 'ai' && (
          <AiMode
            locale={locale}
            isPremium={isPremium}
            onBack={() => setMode('select')}
            onFreeTrialUpdate={setFreeTrialInfo}
          />
        )}

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature="ai_recipe"
        />
      </div>
    </div>
  );
}
