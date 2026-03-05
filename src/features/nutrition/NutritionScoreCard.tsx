'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NutritionScoreCardProps {
  score: number;
  viewMode: 'current' | 'week' | 'month';
  onRefresh: () => void;
}

function getScoreGrade(score: number) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

export function NutritionScoreCard({ score, viewMode, onRefresh }: NutritionScoreCardProps) {
  const t = useTranslations();

  return (
    <Card className={cn(
      'text-white',
      viewMode === 'current'
        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">
              {viewMode === 'current'
                ? t('nutrition.balanceScore')
                : viewMode === 'week' ? t('nutrition.weeklyScore') : t('nutrition.monthlyScore')}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold">{score}</span>
              <span className="text-2xl font-bold text-white/80">/100</span>
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold',
              score >= 60 ? 'bg-white/20' : 'bg-white/10'
            )}>
              {getScoreGrade(score)}
            </div>
          </div>
        </div>

        {viewMode !== 'current' && (
          <p className="text-sm text-white/60 mt-2">
            {t('nutrition.periodAnalysis', { days: viewMode === 'week' ? '7' : '30' })}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="mt-4 text-white hover:bg-white/20"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('nutrition.refresh')}
        </Button>
      </CardContent>
    </Card>
  );
}
