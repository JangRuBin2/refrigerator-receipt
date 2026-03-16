'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, RefreshCw, Plus, AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/constants';
import type { Unit, Category } from '@/types/supabase';

interface RecommendedItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  reason: string;
}

interface AiRecommendationsProps {
  recommendations: RecommendedItem[];
  loading: boolean;
  error: boolean;
  hasFetched: boolean;
  onFetch: () => void;
  onAdd: (item: RecommendedItem) => void;
}

export function AiRecommendations({ recommendations, loading, error, hasFetched, onFetch, onAdd }: AiRecommendationsProps) {
  const t = useTranslations();

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">{t('shopping.aiRecommend')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFetch}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/70 p-3 dark:bg-gray-800/70 animate-pulse"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-600" />
                  </div>
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-600" />
                </div>
                <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-600" />
              </div>
            ))}
            <p className="text-xs text-purple-500 text-center pt-1">
              {t('shopping.aiLoading')}
            </p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white/70 p-3 dark:bg-gray-800/70"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(item.category)}</span>
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="default" className="text-xs">
                      {item.quantity} {t(`units.${item.unit}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAdd(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertTriangle className="mx-auto h-6 w-6 text-orange-400 mb-2" />
            <p className="text-sm text-gray-500">{t('shopping.aiError')}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFetch}
              className="mt-2"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              {t('common.retry')}
            </Button>
          </div>
        ) : !hasFetched ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">{t('shopping.aiPrompt')}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onFetch}
              className="mt-2"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {t('shopping.aiRecommend')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            {t('shopping.aiEmpty')}
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {t('shopping.aiDisclaimer')}
        </p>
      </CardContent>
    </Card>
  );
}
