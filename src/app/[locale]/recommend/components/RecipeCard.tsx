'use client';

import { Clock, Search, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/constants';

interface RecipeData {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  cooking_time?: number;
  difficulty?: string;
  ingredients?: { name: string; quantity?: string }[];
  tags?: string[];
}

interface RecipeCardProps {
  recipe: RecipeData;
  locale: string;
  isBest?: boolean;
}

function getTitle(title: Record<string, string>, locale: string) {
  return title[locale] || title.ko || title.en || '';
}

function getSearchUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' 레시피')}`;
}

export function RecipeCard({ recipe, locale, isBest = false }: RecipeCardProps) {
  const t = useTranslations();
  const title = getTitle(recipe.title, locale);
  const difficultyLabel = getDifficultyLabel(recipe.difficulty, locale);

  return (
    <Card className={cn(
      'overflow-hidden',
      isBest && 'ring-2 ring-primary-500 shadow-lg'
    )}>
      <CardContent className="p-5">
        {isBest && (
          <p className="mb-2 text-sm font-medium text-primary-600">
            {t('recommend.bestMatch')}
          </p>
        )}
        <h3 className="text-xl font-bold">{title}</h3>
        {recipe.description && (
          <p className="mt-1 text-sm text-gray-500">
            {(recipe.description as Record<string, string>)[locale] ||
             (recipe.description as Record<string, string>).ko || ''}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {recipe.cooking_time && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {t('recommend.cookingTime', { time: recipe.cooking_time })}
            </span>
          )}
          {recipe.difficulty && (
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {difficultyLabel}
            </Badge>
          )}
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 6).map((ing, i) => (
                <Badge key={i} variant="default" className="text-xs">
                  {ing.name}
                </Badge>
              ))}
              {recipe.ingredients.length > 6 && (
                <Badge variant="default" className="text-xs">
                  +{recipe.ingredients.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}

        <a
          href={getSearchUrl(title)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Search className="h-4 w-4" />
          {t('recommend.searchThis')}
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}
