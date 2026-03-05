'use client';

import { useTranslations } from 'next-intl';
import { Activity, Flame, Beef, Wheat, Droplets, Leaf, Cookie } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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

const NUTRIENT_CARDS = [
  { key: 'calories', icon: Flame, color: 'orange', unit: 'kcal', field: 'calories' as const },
  { key: 'protein', icon: Beef, color: 'blue', unit: 'g', field: 'protein' as const },
  { key: 'carbs', icon: Wheat, color: 'amber', unit: 'g', field: 'carbs' as const },
  { key: 'fat', icon: Droplets, color: 'red', unit: 'g', field: 'fat' as const },
  { key: 'fiber', icon: Leaf, color: 'green', unit: 'g', field: 'fiber' as const },
  { key: 'sugar', icon: Cookie, color: 'pink', unit: 'g', field: 'sugar' as const },
] as const;

export function MacroNutrients({ nutrition }: MacroNutrientsProps) {
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
          {NUTRIENT_CARDS.map(({ key, icon: Icon, color, unit, field }) => (
            <div key={key} className={`rounded-lg bg-${color}-50 p-3 dark:bg-${color}-900/20`}>
              <div className={`flex items-center gap-2 text-${color}-600`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{t(`nutrition.${key}`)}</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {field === 'calories' ? nutrition[field].toLocaleString() : nutrition[field]}
              </p>
              <p className="text-xs text-gray-500">{unit}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
