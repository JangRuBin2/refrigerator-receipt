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
  Calendar,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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

interface PeriodReport {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  totalItems: number;
  categoryDistribution: Record<string, number>;
  estimatedNutrition: NutritionData;
  purchaseHistory: Array<{
    date: string;
    items: Array<{ name: string; category?: string }>;
  }>;
  trends: {
    mostPurchased: string[];
    categoryTrend: Array<{ category: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  };
  recommendations: string[];
}

export default function NutritionPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [periodReport, setPeriodReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nutrition/analyze');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setReport(data.report);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchPeriodReport = useCallback(async (period: 'week' | 'month') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/nutrition/report?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPeriodReport(data.report);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (viewMode === 'current') {
      fetchCurrentReport();
    } else {
      fetchPeriodReport(viewMode);
    }
  }, [viewMode, fetchCurrentReport, fetchPeriodReport]);

  const handleRefresh = () => {
    if (viewMode === 'current') {
      fetchCurrentReport();
    } else {
      fetchPeriodReport(viewMode);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen">
        <Header locale={locale} title={t('nutrition.title')} />
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-500">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const currentNutrition = viewMode === 'current' ? report?.totalNutrition : periodReport?.estimatedNutrition;
  const macroRatio = currentNutrition ? calculateMacroRatio(currentNutrition) : { protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="min-h-screen pb-20">
      <Header locale={locale} title={t('nutrition.title')} />

      <div className="space-y-4 p-4">
        {/* View Mode Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
          <button
            onClick={() => setViewMode('current')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              viewMode === 'current'
                ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <Activity className="h-4 w-4" />
            현재 상태
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <Calendar className="h-4 w-4" />
            주간
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              viewMode === 'month'
                ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            월간
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : viewMode === 'current' && report ? (
          <>
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
                  onClick={handleRefresh}
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
          </>
        ) : (viewMode === 'week' || viewMode === 'month') && periodReport ? (
          <>
            {/* Period Summary Card */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm">
                      {viewMode === 'week' ? '주간 리포트' : '월간 리포트'}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {periodReport.startDate} ~ {periodReport.endDate}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs text-white/70">총 구매/추가 품목</p>
                    <p className="text-2xl font-bold">{periodReport.totalItems}개</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs text-white/70">카테고리 수</p>
                    <p className="text-2xl font-bold">{Object.keys(periodReport.categoryDistribution).length}종</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-4 text-white hover:bg-white/20"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
              </CardContent>
            </Card>

            {/* Estimated Nutrition */}
            {periodReport.totalItems > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-600" />
                    예상 영양소 (구매 기반)
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 text-orange-600">
                        <Flame className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('nutrition.calories')}</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{periodReport.estimatedNutrition.calories.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Beef className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('nutrition.protein')}</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{periodReport.estimatedNutrition.protein}</p>
                      <p className="text-xs text-gray-500">g</p>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Wheat className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('nutrition.carbs')}</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{periodReport.estimatedNutrition.carbs}</p>
                      <p className="text-xs text-gray-500">g</p>
                    </div>

                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <div className="flex items-center gap-2 text-red-500">
                        <Droplets className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('nutrition.fat')}</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{periodReport.estimatedNutrition.fat}</p>
                      <p className="text-xs text-gray-500">g</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Distribution */}
            {Object.keys(periodReport.categoryDistribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 구매</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {periodReport.trends.categoryTrend.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{getCategoryIcon(cat.category)}</span>
                            <span className="font-medium">{t(`categories.${cat.category}`)}</span>
                          </div>
                          <span className="text-sm font-medium">{cat.count}개</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-primary-500 transition-all"
                            style={{
                              width: `${Math.min((cat.count / periodReport.totalItems) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Most Purchased Items */}
            {periodReport.trends.mostPurchased.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    자주 구매한 품목
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {periodReport.trends.mostPurchased.map((item, index) => (
                      <Badge key={index} variant="default" className="px-3 py-1">
                        {index + 1}. {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Recommendations */}
            {periodReport.recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    구매 패턴 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {periodReport.recommendations.map((rec, index) => (
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

            {/* Purchase History */}
            {periodReport.purchaseHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>최근 구매/추가 기록</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {periodReport.purchaseHistory.map((history, idx) => (
                      <div key={idx} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {history.date}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {history.items.slice(0, 8).map((item, itemIdx) => (
                            <Badge key={itemIdx} variant="default" className="text-xs">
                              {item.name}
                            </Badge>
                          ))}
                          {history.items.length > 8 && (
                            <Badge variant="default" className="text-xs">
                              +{history.items.length - 8}
                            </Badge>
                          )}
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
  );
}
