'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Shuffle, ChefHat, Loader2, RotateCcw } from 'lucide-react';
import { z } from 'zod';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getRecipes, getRandomRecipe } from '@/lib/api/recipes';
import { RecipeCard } from './RecipeCard';

const localizedStringSchema = z.record(z.string(), z.string()).catch({});
const ingredientListSchema = z.array(z.object({ name: z.string(), quantity: z.string().optional() })).catch([]);

interface RandomResult {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  cooking_time?: number;
  difficulty?: string;
  ingredients?: { name: string; quantity?: string }[];
  tags?: string[];
}

interface RandomModeProps {
  locale: string;
  onBack: () => void;
}

export function RandomMode({ locale, onBack }: RandomModeProps) {
  const t = useTranslations();

  const [randomResult, setRandomResult] = useState<RandomResult | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomAnimating, setRandomAnimating] = useState(false);
  const [randomDisplayName, setRandomDisplayName] = useState('');
  const [recipeNames, setRecipeNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchRecipeNames = async () => {
      try {
        const data = await getRecipes({ limit: 50 });
        const names = data.recipes?.map((r) => {
          const title = localizedStringSchema.parse(r.title);
          return title[locale] || title.ko || title.en || '';
        }).filter(Boolean) || [];
        if (names.length > 0) {
          setRecipeNames(names);
        }
      } catch {
        // Keep default names if fetch fails
      }
    };
    fetchRecipeNames();
  }, [locale]);

  const spinRandom = async () => {
    setRandomLoading(true);
    setRandomAnimating(true);
    setRandomResult(null);

    const animNames = recipeNames.length > 0 ? recipeNames : [
      '김치찌개', '비빔밥', '불고기', '떡볶이', '삼겹살',
      '된장찌개', '잡채', '냉면', '칼국수', '제육볶음',
    ];
    let animCount = 0;
    const maxAnim = 15;
    const interval = setInterval(() => {
      setRandomDisplayName(animNames[Math.floor(Math.random() * animNames.length)]);
      animCount++;
      if (animCount >= maxAnim) {
        clearInterval(interval);
      }
    }, 100);

    try {
      const raw = await getRandomRecipe();
      await new Promise(resolve => setTimeout(resolve, maxAnim * 100 + 200));
      clearInterval(interval);

      if (raw) {
        const title = localizedStringSchema.parse(raw.title);
        const description = localizedStringSchema.safeParse(raw.description);
        const parsedIngredients = ingredientListSchema.parse(raw.ingredients);
        const result: RandomResult = {
          id: raw.id,
          title,
          description: description.success ? description.data : undefined,
          cooking_time: raw.cooking_time ?? undefined,
          difficulty: raw.difficulty ?? undefined,
          ingredients: parsedIngredients,
          tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : undefined,
        };
        setRandomResult(result);
        setRandomDisplayName(title[locale] || title.ko || '');
      }
    } catch {
      console.error('Failed to fetch random recipe');
    } finally {
      setRandomLoading(false);
      setRandomAnimating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          <Shuffle className="mr-1 h-3 w-3" />
          {t('recommend.randomMode')}
        </Badge>
      </div>
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
        <CardContent className="p-6 text-center">
          <h2 className="mb-4 text-xl font-bold">{t('recommend.randomTitle')}</h2>

          <div className={cn(
            'mx-auto mb-6 flex h-28 w-full max-w-xs items-center justify-center rounded-2xl bg-white shadow-inner dark:bg-gray-800',
            randomAnimating && 'animate-pulse'
          )}>
            {randomDisplayName ? (
              <span className={cn(
                'text-2xl font-bold transition-all',
                randomAnimating ? 'text-gray-400' : 'text-gray-900 dark:text-white'
              )}>
                {randomDisplayName}
              </span>
            ) : (
              <ChefHat className="h-12 w-12 text-gray-300" />
            )}
          </div>

          <Button
            onClick={spinRandom}
            disabled={randomLoading}
            className="w-full max-w-xs"
            size="lg"
          >
            {randomLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('recommend.spinning')}
              </>
            ) : (
              <>
                <Shuffle className="mr-2 h-5 w-5" />
                {t('recommend.spin')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {randomResult && !randomAnimating && (
        <RecipeCard recipe={randomResult} locale={locale} />
      )}

      <Button
        variant="ghost"
        onClick={() => { onBack(); setRandomResult(null); setRandomDisplayName(''); }}
        className="w-full"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        {t('recommend.retry')}
      </Button>
    </div>
  );
}
