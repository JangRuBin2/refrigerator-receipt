'use client';

import { useTranslations } from 'next-intl';
import { Activity, Flame, Beef, Wheat, Droplets, Leaf, Cookie } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface MacroNutrientsProps {
  nutrition: NutritionData;
  dailyRecommended?: NutritionData | null;
}

function calculateMacroRatio(nutrition: NutritionData) {
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
}

function getPercentage(value: number, recommended: number): number {
  if (recommended === 0) return 0;
  return Math.min(Math.round((value / recommended) * 100), 150);
}

function getPercentageColor(pct: number): string {
  if (pct < 50) return 'text-orange-500';
  if (pct <= 120) return 'text-green-600';
  return 'text-red-500';
}

function getBarColor(pct: number): string {
  if (pct < 50) return 'bg-orange-400';
  if (pct <= 120) return 'bg-green-500';
  return 'bg-red-400';
}

const NUTRIENT_CARDS = [
  { key: 'calories', icon: Flame, bgColor: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600', unit: 'kcal', field: 'calories' as const },
  { key: 'protein', icon: Beef, bgColor: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600', unit: 'g', field: 'protein' as const },
  { key: 'carbs', icon: Wheat, bgColor: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600', unit: 'g', field: 'carbs' as const },
  { key: 'fat', icon: Droplets, bgColor: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600', unit: 'g', field: 'fat' as const },
  { key: 'fiber', icon: Leaf, bgColor: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600', unit: 'g', field: 'fiber' as const },
  { key: 'sugar', icon: Cookie, bgColor: 'bg-pink-50 dark:bg-pink-900/20', iconColor: 'text-pink-600', unit: 'g', field: 'sugar' as const },
] as const;

export function MacroNutrients({ nutrition, dailyRecommended }: MacroNutrientsProps) {
  const t = useTranslations();
  const macroRatio = calculateMacroRatio(nutrition);

  return (
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
          {NUTRIENT_CARDS.map(({ key, icon: Icon, bgColor, iconColor, unit, field }) => {
            const value = nutrition[field];
            const recommended = dailyRecommended?.[field];
            const pct = recommended ? getPercentage(value, recommended) : null;

            return (
              <div key={key} className={cn('rounded-lg p-3', bgColor)}>
                <div className={cn('flex items-center gap-2', iconColor)}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{t(`nutrition.${key}`)}</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {field === 'calories' ? value.toLocaleString() : value}
                </p>
                {pct !== null && recommended ? (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        / {field === 'calories' ? recommended.toLocaleString() : recommended}{unit}
                      </span>
                      <span className={cn('font-medium', getPercentageColor(pct))}>
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getBarColor(pct))}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">{unit}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
