'use client';

import { useTranslations } from 'next-intl';
import { Wand2, Clock, Search, ExternalLink, Heart, Check, Share2, Download, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { AIGeneratedRecipe } from './types';
import { getSearchUrl, getDifficultyLabel, getDifficultyColor } from './utils';

interface RecipeResultProps {
  recipe: AIGeneratedRecipe;
  locale: string;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onSaveImage: () => void;
  onShare: () => void;
}

export function RecipeResult({
  recipe,
  locale,
  saving,
  saved,
  onSave,
  onSaveImage,
  onShare,
}: RecipeResultProps) {
  const t = useTranslations();

  return (
    <Card className="overflow-hidden ring-2 ring-emerald-500 shadow-lg">
      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600">{t('recommend.aiGenerated')}</span>
        </div>

        <h3 className="text-xl font-bold">{recipe.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{recipe.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {t('recommend.cookingTime', { time: recipe.cookingTime })}
          </span>
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {getDifficultyLabel(recipe.difficulty, locale)}
          </Badge>
          <Badge variant="default" className="text-xs">{t('recommend.servings', { count: recipe.servings })}</Badge>
        </div>

        {/* Ingredients */}
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">{t('recipe.ingredients')}</h4>
          <div className="space-y-1">
            {recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="flex justify-between rounded bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-700">
                <span>{ing.name}</span>
                <span className="text-gray-500">{ing.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">{t('recipe.instructions')}</h4>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="text-gray-600 dark:text-gray-400">{step}</li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {recipe.tips && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <p className="text-sm">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">{t('recommend.tip')}: </span>
              <span className="text-emerald-600 dark:text-emerald-300">{recipe.tips}</span>
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {t('common.aiDisclaimer')}
        </p>

        {/* Action Buttons */}
        <div className="mt-5 space-y-3">
          <Button
            onClick={onSave}
            disabled={saving || saved}
            variant={saved ? 'primary' : 'outline'}
            size="sm"
            className={cn('w-full', saved && 'bg-red-500 hover:bg-red-500 text-white')}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-1.5 h-4 w-4" />
            ) : (
              <Heart className="mr-1.5 h-4 w-4" />
            )}
            {saved ? t('recommend.saved') : t('share.saveRecipe')}
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={onSaveImage} variant="outline" size="sm" className="flex-1">
              <Download className="mr-1.5 h-4 w-4" />
              {t('share.saveImage')}
            </Button>
            <Button onClick={onShare} variant="outline" size="sm" className="flex-1">
              <Share2 className="mr-1.5 h-4 w-4" />
              {t('share.share')}
            </Button>
          </div>
          <a
            href={getSearchUrl(recipe.title, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <Search className="h-4 w-4" />
            {t('recommend.searchYoutube')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
