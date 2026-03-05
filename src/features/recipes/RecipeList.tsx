'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChefHat, Clock, Heart, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { getRecipes, mapDBRecipeToRecipe } from '@/lib/api/recipes';
import type { RecipeWithAvailability, RecipeFilter } from './types';
import { getDifficultyColor, enrichRecipeWithAvailability } from './utils';

const RECIPES_PER_PAGE = 10;

interface RecipeListProps {
  locale: string;
  onRecipeClick: (recipe: RecipeWithAvailability) => void;
  onRecipesLoaded: (recipes: RecipeWithAvailability[]) => void;
}

export function RecipeList({ locale, onRecipeClick, onRecipesLoaded }: RecipeListProps) {
  const t = useTranslations();
  const { ingredients, favoriteRecipeIds, toggleFavorite } = useStore();

  const [rawRecipes, setRawRecipes] = useState<ReturnType<typeof mapDBRecipeToRecipe>[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [filter, setFilter] = useState<RecipeFilter>('all');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchRecipes = useCallback(async (currentOffset: number, append = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      if (!append) {
        setRecipesLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getRecipes({ limit: RECIPES_PER_PAGE, offset: currentOffset });
      const mapped = (data.recipes || []).map(mapDBRecipeToRecipe);

      if (append) {
        setRawRecipes(prev => [...prev, ...mapped]);
      } else {
        setRawRecipes(mapped);
      }

      const newHasMore = data.total != null
        ? currentOffset + mapped.length < data.total
        : mapped.length === RECIPES_PER_PAGE;
      setHasMore(newHasMore);
      hasMoreRef.current = newHasMore;
    } catch {
      // error silently
    } finally {
      setRecipesLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  // Enrich with availability/favorite status reactively (no refetch)
  const recipes = useMemo(
    () => rawRecipes.map(r => enrichRecipeWithAvailability(r, ingredients, favoriteRecipeIds)),
    [rawRecipes, ingredients, favoriteRecipeIds]
  );

  // Initial fetch
  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    fetchRecipes(0);
  }, [fetchRecipes]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const newOffset = offsetRef.current + RECIPES_PER_PAGE;
          offsetRef.current = newOffset;
          fetchRecipes(newOffset, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [fetchRecipes]);

  // Notify parent of filtered recipes (ref-based to avoid dependency on callback identity)
  const onRecipesLoadedRef = useRef(onRecipesLoaded);
  onRecipesLoadedRef.current = onRecipesLoaded;

  const filteredRecipes = useMemo(() =>
    recipes.filter((recipe) => {
      if (filter === 'favorites') return recipe.isFavorite;
      if (filter === 'available') return recipe.matchRate >= 50;
      return true;
    }),
    [recipes, filter]
  );

  useEffect(() => {
    onRecipesLoadedRef.current(filteredRecipes);
  }, [filteredRecipes]);

  const handleLoadMore = () => {
    const newOffset = offsetRef.current + RECIPES_PER_PAGE;
    offsetRef.current = newOffset;
    fetchRecipes(newOffset, true);
  };

  return (
    <>
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
      {recipesLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-4 text-gray-500">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : filteredRecipes.length === 0 ? (
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
              onClick={() => onRecipeClick(recipe)}
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

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                <span className="text-sm text-gray-500">{t('common.loading')}</span>
              </div>
            )}
            {hasMore && !loadingMore && (
              <Button variant="outline" onClick={handleLoadMore} className="w-full">
                {t('recipe.loadMore')}
              </Button>
            )}
            {!hasMore && filteredRecipes.length > 0 && (
              <p className="text-center text-sm text-gray-400">
                {t('recipe.allLoaded', { count: filteredRecipes.length })}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
