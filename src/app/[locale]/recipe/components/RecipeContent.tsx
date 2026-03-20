'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clock, Wand2, ChefHat } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/constants';
import { RecipeCTA } from './RecipeCTA';
import type { Json } from '@/types/supabase';

interface RecipeRow {
  id: string;
  title: Json;
  description: Json | null;
  cooking_time: number | null;
  difficulty: string | null;
  servings: number | null;
  ingredients: Json;
  instructions: Json;
  source: string;
}

function getLocalizedString(json: Json, locale: string): string {
  if (typeof json === 'string') return json;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, Json | undefined>;
    return String(obj[locale] ?? obj.ko ?? obj.en ?? '');
  }
  return '';
}

function getLocalizedArray(json: Json, locale: string): string[] {
  if (Array.isArray(json)) return json.filter((s): s is string => typeof s === 'string');
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, Json | undefined>;
    const localized = obj[locale] ?? obj.ko ?? obj.en;
    if (Array.isArray(localized)) return localized.filter((s): s is string => typeof s === 'string');
  }
  return [];
}

function getIngredientsList(json: Json): Array<{ name: string; quantity: string }> {
  if (!Array.isArray(json)) return [];
  return json
    .map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const obj = item as Record<string, unknown>;
        return {
          name: typeof obj.name === 'string' ? obj.name : '',
          quantity: typeof obj.quantity === 'string' ? obj.quantity : '',
        };
      }
      if (typeof item === 'string') return { name: item, quantity: '' };
      return null;
    })
    .filter((item): item is { name: string; quantity: string } => item !== null && item.name !== '');
}

export function RecipeContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = (params.locale as string) || 'ko';

  // /locale/recipe?id=xxx (쿼리) 또는 /locale/recipe/{id} (path param, 토스 딥링크) 둘 다 지원
  const recipeId = useMemo(() => {
    const fromQuery = searchParams.get('id');
    if (fromQuery) return fromQuery;
    const segments = pathname.split('/').filter(Boolean);
    // segments: [locale, 'recipe', recipeId]
    if (segments.length >= 3 && segments[1] === 'recipe') {
      return segments[2];
    }
    return null;
  }, [searchParams, pathname]);

  const [recipe, setRecipe] = useState<RecipeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchRecipe = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('recipes')
          .select('id, title, description, cooking_time, difficulty, servings, ingredients, instructions, source')
          .eq('id', recipeId)
          .single();

        if (fetchError || !data) {
          setError(true);
        } else {
          setRecipe(data as RecipeRow);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Skeleton variant="text" className="h-6 w-32" />
        <Skeleton variant="card" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <ChefHat className="mb-4 h-16 w-16 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-700 dark:text-gray-300">
          {t('share.notFound')}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {t('share.notFoundDescription')}
        </p>
        <Button
          onClick={() => { window.location.href = `/${locale}/`; }}
          className="mt-6"
          variant="primary"
        >
          {t('share.goHome')}
        </Button>
      </div>
    );
  }

  const title = getLocalizedString(recipe.title, locale);
  const description = recipe.description ? getLocalizedString(recipe.description, locale) : '';
  const ingredientsList = getIngredientsList(recipe.ingredients);
  const instructions = getLocalizedArray(recipe.instructions, locale);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Wand2 className="mr-1 h-3 w-3" />
          {t('share.sharedRecipe')}
        </Badge>
      </div>

      {/* Recipe Card */}
      <Card className="overflow-hidden ring-2 ring-emerald-500 shadow-lg">
        <CardContent className="p-5">
          <h1 className="text-xl font-bold">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {recipe.cooking_time && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {t('recommend.cookingTime', { time: recipe.cooking_time })}
              </span>
            )}
            {recipe.difficulty && (
              <Badge className={getDifficultyColor(recipe.difficulty)}>
                {getDifficultyLabel(recipe.difficulty, locale)}
              </Badge>
            )}
            {recipe.servings && (
              <Badge variant="default" className="text-xs">
                {t('recommend.servings', { count: recipe.servings })}
              </Badge>
            )}
          </div>

          {/* Ingredients */}
          {ingredientsList.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 font-semibold">{t('recipe.ingredients')}</h2>
              <div className="space-y-1">
                {ingredientsList.map((ing, idx) => (
                  <div key={idx} className="flex justify-between rounded bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-700">
                    <span>{ing.name}</span>
                    {ing.quantity && <span className="text-gray-500">{ing.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 font-semibold">{t('recipe.instructions')}</h2>
              <ol className="list-inside list-decimal space-y-2 text-sm">
                {instructions.map((step, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-400">
                    {step.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* AI Disclaimer */}
          {recipe.source === 'ai' && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('common.aiDisclaimer')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <RecipeCTA recipeId={recipe.id} locale={locale} />
    </div>
  );
}
