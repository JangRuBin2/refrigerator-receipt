'use client';

import { useTranslations } from 'next-intl';
import { Clock, Heart, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { RecipeWithAvailability } from './types';
import { getDifficultyColor } from './utils';

interface RecipeDetailModalProps {
  locale: string;
  recipe: RecipeWithAvailability | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailModal({ locale, recipe, isOpen, onClose }: RecipeDetailModalProps) {
  const t = useTranslations();
  const { favoriteRecipeIds, toggleFavorite } = useStore();

  if (!recipe) return null;

  const isFavorite = favoriteRecipeIds.includes(recipe.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipe.title[locale] || recipe.title.en}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {recipe.description[locale] || recipe.description.en}
        </p>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4" />
            {t('recipe.minutes', { time: recipe.cookingTime })}
          </span>
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {t(`recipe.${recipe.difficulty}`)}
          </Badge>
        </div>

        {/* Ingredients */}
        <div>
          <h4 className="mb-2 font-semibold">{t('recipe.ingredients')}</h4>
          <div className="space-y-1">
            {recipe.ingredientsWithStatus?.map((ing, idx) => (
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
          {(recipe.instructions[locale] || recipe.instructions.en)?.length ? (
            <ol className="list-inside list-decimal space-y-2">
              {(recipe.instructions[locale] || recipe.instructions.en)?.map(
                (step, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-400">
                    {step}
                  </li>
                )
              )}
            </ol>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('common.comingSoon')}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => toggleFavorite(recipe.id)}
            className="flex-1"
          >
            <Heart
              className={cn(
                'mr-2 h-4 w-4',
                isFavorite ? 'fill-red-500 text-red-500' : ''
              )}
            />
            {isFavorite ? t('recipe.removeFromFavorites') : t('recipe.addToFavorites')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
