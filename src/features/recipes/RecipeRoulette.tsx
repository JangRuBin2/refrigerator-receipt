'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChefHat, Clock, Shuffle } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { getRandomRecipe, mapDBRecipeToRecipe, type DBRecipe } from '@/lib/api/recipes';
import type { RecipeWithAvailability } from './types';
import { getDifficultyColor, enrichRecipeWithAvailability } from './utils';

interface RecipeRouletteProps {
  locale: string;
  filteredRecipes: RecipeWithAvailability[];
  onSelectRecipe: (recipe: RecipeWithAvailability) => void;
  onViewRecipe: () => void;
}

export function RecipeRoulette({ locale, filteredRecipes, onSelectRecipe, onViewRecipe }: RecipeRouletteProps) {
  const t = useTranslations();
  const { ingredients, favoriteRecipeIds } = useStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithAvailability | null>(null);

  const spinRoulette = useCallback(async () => {
    setIsSpinning(true);
    setSelectedRecipe(null);

    let animCount = 0;
    const maxAnim = 15;
    const interval = setInterval(() => {
      if (filteredRecipes.length > 0) {
        const idx = Math.floor(Math.random() * filteredRecipes.length);
        setSelectedRecipe(filteredRecipes[idx]);
      }
      animCount++;
      if (animCount >= maxAnim) clearInterval(interval);
    }, 100);

    try {
      const dbRecipe = await getRandomRecipe() as unknown as DBRecipe;
      await new Promise(resolve => setTimeout(resolve, maxAnim * 100 + 200));
      clearInterval(interval);

      if (dbRecipe) {
        const mapped = mapDBRecipeToRecipe(dbRecipe);
        const enriched = enrichRecipeWithAvailability(mapped, ingredients, favoriteRecipeIds);
        setSelectedRecipe(enriched);
        onSelectRecipe(enriched);
      }
    } catch {
      clearInterval(interval);
      if (filteredRecipes.length > 0) {
        const idx = Math.floor(Math.random() * filteredRecipes.length);
        const recipe = filteredRecipes[idx];
        setSelectedRecipe(recipe);
        onSelectRecipe(recipe);
      }
    } finally {
      setIsSpinning(false);
    }
  }, [filteredRecipes, ingredients, favoriteRecipeIds, onSelectRecipe]);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6 text-center">
        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">{t('home.whatToEat')}</h2>

        {selectedRecipe ? (
          <div
            className={cn(
              'mb-4 rounded-xl bg-white p-4 shadow-md transition-all dark:bg-gray-800',
              isSpinning && 'animate-pulse'
            )}
          >
            <h3 className="text-lg font-semibold">
              {selectedRecipe.title[locale] || selectedRecipe.title.en}
            </h3>
            <div className="mt-2 flex items-center justify-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('recipe.minutes', { time: selectedRecipe.cookingTime })}
              </span>
              <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                {t(`recipe.${selectedRecipe.difficulty}`)}
              </Badge>
            </div>
            <div className="mt-2">
              <Badge variant="info">
                {t('recipe.matchRate')}: {selectedRecipe.matchRate}%
              </Badge>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-white/70 dark:bg-gray-800/50">
            <ChefHat className="h-12 w-12 text-primary-300" />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={spinRoulette}
            disabled={isSpinning || filteredRecipes.length === 0}
            className="flex-1"
          >
            <Shuffle className={cn('mr-2 h-4 w-4', isSpinning && 'animate-spin')} />
            {isSpinning ? t('recipe.spinning') : t('recipe.spin')}
          </Button>
          {selectedRecipe && !isSpinning && (
            <Button
              variant="outline"
              onClick={onViewRecipe}
              className="bg-white dark:bg-gray-800"
            >
              {t('recipe.viewRecipe')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
