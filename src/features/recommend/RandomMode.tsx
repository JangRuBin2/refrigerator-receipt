'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Shuffle, ChefHat, Loader2, RotateCcw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getRecipes, getRandomRecipe } from '@/lib/api/recipes';
import type { RandomResult } from './types';
import { RecipeCard } from './RecipeCard';

interface RandomModeProps {
  locale: string;
  onBack: () => void;
}

export function RandomMode({ locale, onBack }: RandomModeProps) {
  const t = useTranslations();

  const [result, setResult] = useState<RandomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [recipeNames, setRecipeNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const data = await getRecipes({ limit: 50 });
        const names = data.recipes.map((r) =>
          r.title[locale] || r.title.ko || r.title.en || ''
        ).filter(Boolean);
        if (names.length > 0) setRecipeNames(names);
      } catch {
        // Keep default names if fetch fails
      }
    };
    fetchNames();
  }, [locale]);

  const spin = useCallback(async () => {
    setLoading(true);
    setAnimating(true);
    setResult(null);

    const animNames = recipeNames.length > 0 ? recipeNames : [
      '김치찌개', '비빔밥', '불고기', '떡볶이', '삼겹살',
      '된장찌개', '잡채', '냉면', '칼국수', '제육볶음',
    ];
    let animCount = 0;
    const maxAnim = 15;
    const interval = setInterval(() => {
      setDisplayName(animNames[Math.floor(Math.random() * animNames.length)]);
      animCount++;
      if (animCount >= maxAnim) clearInterval(interval);
    }, 100);

    try {
      const data = await getRandomRecipe() as unknown as RandomResult;
      await new Promise(resolve => setTimeout(resolve, maxAnim * 100 + 200));
      clearInterval(interval);

      if (data) {
        setResult(data);
        setDisplayName(data.title?.[locale] || data.title?.ko || '');
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
      setAnimating(false);
    }
  }, [locale, recipeNames]);

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
            animating && 'animate-pulse'
          )}>
            {displayName ? (
              <span className={cn(
                'text-2xl font-bold transition-all',
                animating ? 'text-gray-400' : 'text-gray-900 dark:text-white'
              )}>
                {displayName}
              </span>
            ) : (
              <ChefHat className="h-12 w-12 text-gray-300" />
            )}
          </div>

          <Button onClick={spin} disabled={loading} className="w-full max-w-xs" size="lg">
            {loading ? (
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

      {result && !animating && <RecipeCard recipe={result} locale={locale} />}

      <Button
        variant="outline"
        onClick={() => { onBack(); }}
        className="w-full"
      >
        {t('recommend.backToSelect')}
      </Button>
    </div>
  );
}
