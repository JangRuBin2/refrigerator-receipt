'use client';

import { useTranslations } from 'next-intl';
import { Wand2, Clock, Search, ExternalLink, Heart, Check, Share2, Download, Loader2, Users } from 'lucide-react';

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
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500" />

      <CardContent className="p-5">
        {/* AI Badge + Title */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Wand2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            {t('recommend.aiGenerated')}
          </span>
        </div>

        <h3 className="text-xl font-bold leading-tight">{recipe.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{recipe.description}</p>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <Clock className="h-3 w-3" />
            {recipe.cookingTime}{locale === 'ko' ? '분' : 'min'}
          </div>
          <Badge className={cn('px-2.5 py-1', getDifficultyColor(recipe.difficulty))}>
            {getDifficultyLabel(recipe.difficulty, locale)}
          </Badge>
          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <Users className="h-3 w-3" />
            {t('recommend.servings', { count: recipe.servings })}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100 dark:border-gray-700" />

        {/* Ingredients */}
        <div>
          <h4 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t('recipe.ingredients')}
          </h4>
          <div className="rounded-lg bg-gray-50 p-1 dark:bg-gray-800/50">
            {recipe.ingredients.map((ing, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                  idx % 2 === 0
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-transparent'
                )}
              >
                <span className="font-medium text-gray-700 dark:text-gray-200">{ing.name}</span>
                <span className="text-gray-400">{ing.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100 dark:border-gray-700" />

        {/* Instructions */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            {t('recipe.instructions')}
          </h4>
          <div className="space-y-3">
            {recipe.instructions.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                  {idx + 1}
                </div>
                <p className="pt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {step.replace(/^\d+\.\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {recipe.tips && (
          <div className="mt-4 flex gap-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 p-3.5 dark:from-emerald-900/20 dark:to-cyan-900/20">
            <span className="shrink-0 text-lg">💡</span>
            <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-300">
              {recipe.tips}
            </p>
          </div>
        )}

        {/* AI Disclaimer */}
        <p className="mt-4 text-center text-[11px] text-gray-400">
          {t('common.aiDisclaimer')}
        </p>

        {/* Action Buttons */}
        <div className="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
          {/* Primary: Save */}
          <Button
            onClick={onSave}
            disabled={saving || saved}
            variant={saved ? 'primary' : 'secondary'}
            className={cn(
              'w-full',
              saved
                ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            )}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Heart className="mr-2 h-4 w-4" />
            )}
            {saved ? t('recommend.saved') : t('share.saveRecipe')}
          </Button>

          {/* Secondary row: Image Save + Share */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={onSaveImage} variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              {t('share.saveImage')}
            </Button>
            <Button onClick={onShare} variant="outline" size="sm">
              <Share2 className="mr-1.5 h-4 w-4" />
              {t('share.share')}
            </Button>
          </div>

          {/* YouTube search */}
          <a
            href={getSearchUrl(recipe.title, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <Search className="h-3.5 w-3.5" />
            {t('recommend.searchYoutube')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
