'use client';

import { Shuffle, Sparkles, Wand2, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Mode } from './types';

interface ModeSelectorProps {
  isPremium: boolean;
  onSelectMode: (mode: Mode) => void;
  onAiModeClick: () => void;
}

export function ModeSelector({ isPremium, onSelectMode, onAiModeClick }: ModeSelectorProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <Card
        className="cursor-pointer bg-gradient-to-br from-orange-50 to-red-50 transition-transform hover:scale-[1.02] dark:from-orange-900/20 dark:to-red-900/20"
        onClick={() => onSelectMode('random')}
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
        onClick={() => onSelectMode('taste')}
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
        onClick={onAiModeClick}
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
            <h2 className="text-lg font-bold">AI 맞춤 레시피</h2>
            <p className="mt-1 text-sm text-gray-500">내 냉장고 재료로 AI가 새로운 레시피를 만들어줘요</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
