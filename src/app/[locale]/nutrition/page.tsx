'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Activity, Loader2, RefreshCw, Sparkles, AlertCircle, Calendar, BarChart3 } from 'lucide-react';

import { PremiumGate } from '@/components/premium/PremiumGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/constants';
import { analyzeNutrition, analyzePeriodNutrition } from '@/lib/api/nutrition';
import { NutritionScoreCard } from '@/features/nutrition/NutritionScoreCard';
import { MacroNutrients } from '@/features/nutrition/MacroNutrients';
import { CategoryBalanceCard } from '@/features/nutrition/CategoryBalanceCard';

type ViewMode = 'current' | 'week' | 'month';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface CategoryBalance {
  category: string;
  count: number;
  percentage: number;
  status: 'good' | 'low' | 'high';
}

interface NutritionReport {
  totalNutrition: NutritionData;
  ingredients: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    nutrition: NutritionData;
  }>;
  categoryBalance: CategoryBalance[];
  score: number;
  recommendations: string[];
  period: string;
}

export default function NutritionPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const fetchReport = useCallback(async (mode: ViewMode) => {
    setLoading(true);
    setError(null);
    try {
      const data = mode === 'current'
        ? await analyzeNutrition() as { report: NutritionReport }
        : await analyzePeriodNutrition(mode) as { report: NutritionReport };
      setReport(data.report);
      setHasAnalyzed(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${t('common.error')} [${msg}]`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleAnalyze = () => fetchReport(viewMode);

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-500">{error}</p>
          <Button onClick={handleAnalyze} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate feature="nutrition_analysis">
    <div className="min-h-screen pb-8">
      <div className="space-y-4 p-4">
        {/* View Mode Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
          {([
            { mode: 'current' as const, icon: Activity, label: t('nutrition.current') },
            { mode: 'week' as const, icon: Calendar, label: t('nutrition.weekly') },
            { mode: 'month' as const, icon: BarChart3, label: t('nutrition.monthly') },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                viewMode === mode
                  ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {!hasAnalyzed && !loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('nutrition.noData')}</p>
              <Button onClick={handleAnalyze} className="mt-4">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('nutrition.analyze')}
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : report ? (
          <>
            <NutritionScoreCard score={report.score} viewMode={viewMode} onRefresh={handleAnalyze} />
            <MacroNutrients nutrition={report.totalNutrition} />
            <CategoryBalanceCard categories={report.categoryBalance} />

            {/* AI Recommendations */}
            {report.recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    {t('nutrition.aiRecommendations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 rounded-lg bg-white/70 p-3 dark:bg-gray-800/70">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600 dark:bg-purple-900/50">
                          {index + 1}
                        </span>
                        <span className="flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('nutrition.aiDisclaimer')}</p>
                </CardContent>
              </Card>
            )}

            {/* Ingredient Details */}
            {report.ingredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('nutrition.ingredientDetails')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {report.ingredients.slice(0, 10).map((ing, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <span>{getCategoryIcon(ing.category)}</span>
                          <span className="font-medium">{ing.name}</span>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <span>{ing.nutrition.calories} kcal</span>
                          <span className="mx-1">·</span>
                          <span>P {ing.nutrition.protein}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('nutrition.noData')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </PremiumGate>
  );
}
