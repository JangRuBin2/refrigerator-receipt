'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Activity,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  Cookie,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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

  const [report, setReport] = useState<NutritionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nutrition/analyze');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      vegetables: '🥬',
      fruits: '🍎',
      meat: '🥩',
      seafood: '🐟',
      dairy: '🥛',
      condiments: '🧂',
      grains: '🌾',
      beverages: '🥤',
      snacks: '🍪',
      etc: '📦',
    };
    return icons[category] || '📦';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Minus className="h-4 w-4 text-green-500" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good':
        return t('nutrition.statusGood');
      case 'low':
        return t('nutrition.statusLow');
      case 'high':
        return t('nutrition.statusHigh');
      default:
        return '';
    }
  };

  // 매크로 영양소 비율 계산
  const calculateMacroRatio = (nutrition: NutritionData) => {
    const proteinCal = nutrition.protein * 4;
    const carbsCal = nutrition.carbs * 4;
    const fatCal = nutrition.fat * 9;
    const total = proteinCal + carbsCal + fatCal;

    if (total === 0) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: Math.round((proteinCal / total) * 100),
      carbs: Math.round((carbsCal / total) * 100),
      fat: Math.round((fatCal / total) * 100),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header locale={locale} title={t('nutrition.title')} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header locale={locale} title={t('nutrition.title')} />
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-500">{error}</p>
          <Button onClick={fetchReport} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const macroRatio = calculateMacroRatio(report.totalNutrition);

  return (
    <div className="min-h-screen pb-20">
      <Header locale={locale} title={t('nutrition.title')} />

      <div className="space-y-4 p-4">
        {/* Score Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t('nutrition.balanceScore')}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-bold">{report.score}</span>
                  <span className="text-2xl font-bold text-white/80">/100</span>
                </div>
              </div>
              <div className="text-center">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold',
                  report.score >= 60 ? 'bg-white/20' : 'bg-white/10'
                )}>
                  {getScoreGrade(report.score)}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchReport}
              className="mt-4 text-white hover:bg-white/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('nutrition.refresh')}
            </Button>
          </CardContent>
        </Card>

        {/* Macro Nutrients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              {t('nutrition.macroNutrients')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Macro Bar */}
            <div className="h-6 rounded-full overflow-hidden flex mb-4">
              <div
                className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${macroRatio.protein}%` }}
              >
                {macroRatio.protein > 10 && `${macroRatio.protein}%`}
              </div>
              <div
                className="bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${macroRatio.carbs}%` }}
              >
                {macroRatio.carbs > 10 && `${macroRatio.carbs}%`}
              </div>
              <div
                className="bg-red-400 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${macroRatio.fat}%` }}
              >
                {macroRatio.fat > 10 && `${macroRatio.fat}%`}
              </div>
            </div>

            {/* Nutrient Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                <div className="flex items-center gap-2 text-orange-600">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.calories')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.calories.toLocaleString()}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 text-blue-600">
                  <Beef className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.protein')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.protein}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>

              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-amber-600">
                  <Wheat className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.carbs')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.carbs}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-500">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.fat')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.fat}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>

              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-green-600">
                  <Leaf className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.fiber')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.fiber}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>

              <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-900/20">
                <div className="flex items-center gap-2 text-pink-500">
                  <Cookie className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nutrition.sugar')}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{report.totalNutrition.sugar}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Balance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('nutrition.categoryBalance')}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.categoryBalance.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t('nutrition.noData')}</p>
            ) : (
              <div className="space-y-3">
                {report.categoryBalance.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(cat.category)}</span>
                        <span className="font-medium">{t(`categories.${cat.category}`)}</span>
                        <Badge
                          variant={cat.status === 'good' ? 'success' : cat.status === 'low' ? 'warning' : 'danger'}
                          className="text-xs"
                        >
                          {getStatusText(cat.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cat.status)}
                        <span className="text-sm font-medium">{cat.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          cat.status === 'good' && 'bg-green-500',
                          cat.status === 'low' && 'bg-orange-500',
                          cat.status === 'high' && 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-white/70 p-3 dark:bg-gray-800/70"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600 dark:bg-purple-900/50">
                      {index + 1}
                    </span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
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
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                  >
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
      </div>
    </div>
  );
}
