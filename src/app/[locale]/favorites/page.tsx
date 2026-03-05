'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Loader2, Clock, Trash2, ChefHat } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { getFavorites, removeFavorite } from '@/lib/api/favorites';
import { toast } from '@/store/useToastStore';

interface FavoriteRecipe {
  id: string;
  created_at: string;
  recipe: {
    id: string;
    title: Record<string, string>;
    description?: Record<string, string>;
    cooking_time?: number;
    difficulty?: string;
    servings?: number;
    ingredients?: Array<{ name: string; quantity?: string }>;
    instructions?: string[];
    tips?: string;
    source?: string;
  } | null;
}

export default function FavoritesPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale ?? 'ko');

  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavorites();
      setFavorites(data as FavoriteRecipe[]);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (recipeId: string) => {
    setRemovingId(recipeId);
    try {
      await removeFavorite(recipeId);
      setFavorites(prev => prev.filter(f => f.recipe?.id !== recipeId));
      toast.success(t('favorites.removed'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/${locale}/recipe?id=${recipeId}`);
  };

  const getLocalizedText = (field: Record<string, string> | undefined | null): string => {
    if (!field) return '';
    return field[locale] || field.ko || field.en || Object.values(field)[0] || '';
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return '';
    if (locale === 'ko') {
      return { easy: '쉬움', medium: '보통', hard: '어려움' }[difficulty] ?? difficulty;
    }
    return difficulty;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <h1 className="text-lg font-bold">{t('favorites.title')}</h1>
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {favorites.length}
          </Badge>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">{t('favorites.empty')}</p>
              <Button
                onClick={() => router.push(`/${locale}/recommend`)}
                className="mt-4"
                variant="outline"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                {t('favorites.goToRecipes')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => {
              const recipe = fav.recipe;
              if (!recipe) return null;

              const title = getLocalizedText(recipe.title);
              const description = getLocalizedText(recipe.description);

              return (
                <Card key={fav.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <button
                      onClick={() => handleRecipeClick(recipe.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{title}</h3>
                          {description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {recipe.cooking_time && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {recipe.cooking_time}min
                              </span>
                            )}
                            {recipe.difficulty && (
                              <Badge className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800">
                                {getDifficultyLabel(recipe.difficulty)}
                              </Badge>
                            )}
                            {recipe.source === 'ai' && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
                                AI
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(recipe.id)}
                        disabled={removingId === recipe.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {removingId === recipe.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
