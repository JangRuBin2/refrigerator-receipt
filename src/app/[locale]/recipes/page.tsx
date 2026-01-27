'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { ChefHat, Clock, Heart, Shuffle, Check, X, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { sampleRecipes } from '@/data/recipes';
import type { Recipe, RecipeIngredient } from '@/types';

interface RecipeWithAvailability extends Recipe {
  matchRate: number;
  availableCount: number;
  isFavorite: boolean;
  ingredientsWithStatus: (RecipeIngredient & { isAvailable: boolean })[];
}

function RecipesContent() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const meal = searchParams.get('meal');

  const { ingredients, favoriteRecipeIds, toggleFavorite } = useStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithAvailability | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'favorites'>('all');

  // Check ingredient availability for each recipe
  const recipesWithAvailability = sampleRecipes.map((recipe) => {
    const availableIngredients = recipe.ingredients.filter((ri) =>
      ingredients.some((i) => i.name.includes(ri.name) || ri.name.includes(i.name))
    );
    const matchRate = Math.round((availableIngredients.length / recipe.ingredients.length) * 100);

    return {
      ...recipe,
      matchRate,
      availableCount: availableIngredients.length,
      isFavorite: favoriteRecipeIds.includes(recipe.id),
      ingredientsWithStatus: recipe.ingredients.map((ri) => ({
        ...ri,
        isAvailable: ingredients.some((i) => i.name.includes(ri.name) || ri.name.includes(i.name)),
      })),
    };
  });

  // Filter recipes
  const filteredRecipes = recipesWithAvailability.filter((recipe) => {
    if (filter === 'favorites') return recipe.isFavorite;
    if (filter === 'available') return recipe.matchRate >= 50;
    return true;
  });

  // Random recipe selection
  const spinRoulette = () => {
    if (filteredRecipes.length === 0) return;

    setIsSpinning(true);
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
      setSelectedRecipe(filteredRecipes[randomIndex]);
      count++;

      if (count >= maxCount) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  // Show random recipe on mount if meal param exists
  useEffect(() => {
    if (meal && filteredRecipes.length > 0) {
      spinRoulette();
    }
  }, [meal]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Random Recipe Section */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <CardContent className="p-6 text-center">
          <h2 className="mb-4 text-xl font-bold">{t('home.whatToEat')}</h2>

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
            <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-white/50 dark:bg-gray-800/50">
              <ChefHat className="h-12 w-12 text-gray-300" />
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
                variant="secondary"
                onClick={() => setShowRecipeModal(true)}
              >
                {t('recipe.viewRecipe')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'available', 'favorites'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            )}
          >
            {f === 'all' && t('fridge.all')}
            {f === 'available' && t('recipe.available')}
            {f === 'favorites' && t('recipe.favorites')}
          </button>
        ))}
      </div>

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">{t('recipe.noRecipes')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => {
                setSelectedRecipe(recipe);
                setShowRecipeModal(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {recipe.title[locale] || recipe.title.en}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                      {recipe.description[locale] || recipe.description.en}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {t('recipe.minutes', { time: recipe.cookingTime })}
                      </span>
                      <Badge className={getDifficultyColor(recipe.difficulty)}>
                        {t(`recipe.${recipe.difficulty}`)}
                      </Badge>
                      <Badge
                        variant={recipe.matchRate >= 80 ? 'success' : recipe.matchRate >= 50 ? 'warning' : 'default'}
                      >
                        {recipe.matchRate}%
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.id);
                    }}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5',
                        recipe.isFavorite
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400'
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={selectedRecipe?.title[locale] || selectedRecipe?.title.en}
        className="max-w-lg"
      >
        {selectedRecipe && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedRecipe.description[locale] || selectedRecipe.description.en}
            </p>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                {t('recipe.minutes', { time: selectedRecipe.cookingTime })}
              </span>
              <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                {t(`recipe.${selectedRecipe.difficulty}`)}
              </Badge>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="mb-2 font-semibold">{t('recipe.ingredients')}</h4>
              <div className="space-y-1">
                {selectedRecipe.ingredientsWithStatus?.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      {ing.isAvailable ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-400" />
                      )}
                      {ing.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {ing.quantity} {t(`units.${ing.unit}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="mb-2 font-semibold">{t('recipe.instructions')}</h4>
              <ol className="list-inside list-decimal space-y-2">
                {(selectedRecipe.instructions[locale] || selectedRecipe.instructions.en)?.map(
                  (step, idx) => (
                    <li key={idx} className="text-gray-600 dark:text-gray-400">
                      {step}
                    </li>
                  )
                )}
              </ol>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => toggleFavorite(selectedRecipe.id)}
                className="flex-1"
              >
                <Heart
                  className={cn(
                    'mr-2 h-4 w-4',
                    favoriteRecipeIds.includes(selectedRecipe.id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  )}
                />
                {favoriteRecipeIds.includes(selectedRecipe.id)
                  ? t('recipe.removeFromFavorites')
                  : t('recipe.addToFavorites')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function RecipesLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

export default function RecipesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen">
      <Header locale={locale} title={t('recipe.title')} />
      <Suspense fallback={<RecipesLoading />}>
        <RecipesContent />
      </Suspense>
    </div>
  );
}
