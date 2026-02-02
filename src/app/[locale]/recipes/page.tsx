'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { ChefHat, Clock, Heart, Shuffle, Check, X, Loader2, ExternalLink, Search, Youtube, Crown, AlertTriangle, Timer } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { cn } from '@/lib/utils';
import type { Recipe, RecipeIngredient, ExternalRecipe, Difficulty } from '@/types';

const RECIPES_PER_PAGE = 10;

// DB 레시피를 프론트엔드 Recipe 타입으로 변환
interface DBRecipe {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  image_url?: string;
  cooking_time?: number;
  difficulty?: string;
  servings?: number;
  ingredients?: { name: string; quantity?: string }[];
  instructions?: Record<string, string[]>;
  tags?: string[];
}

const mapDBRecipeToRecipe = (dbRecipe: DBRecipe): Recipe => ({
  id: dbRecipe.id,
  title: dbRecipe.title || {},
  description: dbRecipe.description || {},
  imageUrl: dbRecipe.image_url,
  cookingTime: dbRecipe.cooking_time || 0,
  difficulty: (dbRecipe.difficulty as Difficulty) || 'easy',
  ingredients: (dbRecipe.ingredients || []).map(ing => ({
    name: ing.name,
    quantity: parseFloat(ing.quantity || '0') || 0,
    unit: 'g' as const,
  })),
  instructions: dbRecipe.instructions || {},
});

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
  const { isPremium } = usePremium();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithAvailability | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'favorites'>('all');
  const [externalRecipes, setExternalRecipes] = useState<ExternalRecipe[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalQuery, setExternalQuery] = useState('');
  const [externalError, setExternalError] = useState('');
  const [externalFilter, setExternalFilter] = useState<'all' | 'youtube' | 'google'>('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [searchStrategy, setSearchStrategy] = useState<'random' | 'expiring'>('random');
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [apiStatus, setApiStatus] = useState<{ youtube: boolean; google: boolean } | null>(null);

  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch recipes from DB with pagination
  const fetchRecipes = useCallback(async (currentOffset: number, append = false) => {
    try {
      if (!append) {
        setRecipesLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/recipes?limit=${RECIPES_PER_PAGE}&offset=${currentOffset}`);
      if (response.ok) {
        const data = await response.json();
        const mappedRecipes = (data.recipes || []).map(mapDBRecipeToRecipe);

        if (append) {
          setRecipes(prev => [...prev, ...mappedRecipes]);
        } else {
          setRecipes(mappedRecipes);
        }

        // Check if there are more recipes to load
        const total = data.total || 0;
        setHasMore(currentOffset + mappedRecipes.length < total);
      }
    } catch {
      // error silently
    } finally {
      setRecipesLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRecipes(0);
  }, [fetchRecipes]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !recipesLoading) {
          const newOffset = offset + RECIPES_PER_PAGE;
          setOffset(newOffset);
          fetchRecipes(newOffset, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, recipesLoading, offset, fetchRecipes]);

  // Check ingredient availability for each recipe
  const recipesWithAvailability = recipes.map((recipe) => {
    const availableIngredients = recipe.ingredients.filter((ri) =>
      ingredients.some((i) => i.name.includes(ri.name) || ri.name.includes(i.name))
    );
    const totalIngredients = recipe.ingredients.length || 1;
    const matchRate = Math.round((availableIngredients.length / totalIngredients) * 100);

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

  const searchExternalRecipes = async (useCustomQuery = false) => {
    // 프리미엄 체크
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setExternalLoading(true);
    setExternalError('');
    setExternalRecipes([]);

    try {
      let url = '/api/recipes/search?type=all';

      if (useCustomQuery && customSearchQuery.trim()) {
        // 수동 검색
        url += `&q=${encodeURIComponent(customSearchQuery.trim())}`;
      } else {
        // 재료 기반 검색
        url += `&strategy=${searchStrategy}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // API 상태 저장
      if (data.apiStatus) {
        setApiStatus(data.apiStatus);
      }

      if (!response.ok) {
        if (response.status === 503) {
          setExternalError(t('recipe.apiNotConfigured'));
        } else {
          setExternalError(data.error || t('common.error'));
        }
        return;
      }

      setExternalRecipes(data.results || []);
      setExternalQuery(data.query || '');
    } catch {
      setExternalError(t('common.error'));
    } finally {
      setExternalLoading(false);
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearchQuery.trim()) {
      searchExternalRecipes(true);
    }
  };

  const filteredExternalRecipes = externalRecipes.filter(r => {
    if (externalFilter === 'all') return true;
    return r.source === externalFilter;
  });

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

  // 유통기한 임박 재료 개수
  const expiringCount = ingredients.filter(i => {
    const daysLeft = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft >= 0;
  }).length;

  return (
    <div className="space-y-4 p-4">
      {/* Random Recipe Section */}
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
                onClick={() => setShowRecipeModal(true)}
                className="bg-white dark:bg-gray-800"
              >
                {t('recipe.viewRecipe')}
              </Button>
            )}
          </div>
        </div>
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

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                <span className="text-sm text-gray-500">{t('common.loading')}</span>
              </div>
            )}
            {!hasMore && filteredRecipes.length > 0 && (
              <p className="text-center text-sm text-gray-400">
                {t('common.noData')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* External Recipe Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary-600" />
              {t('recipe.externalRecommend')}
            </h2>
            {!isPremium && (
              <Badge variant="warning" className="text-xs">
                <Crown className="mr-1 h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>

          {/* 수동 검색 입력 */}
          <form onSubmit={handleCustomSearch} className="mb-4">
            <div className="relative">
              <Input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                placeholder={t('recipe.searchPlaceholder')}
                className="pr-12"
              />
              <button
                type="submit"
                disabled={externalLoading || !customSearchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* 전략 선택 */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setSearchStrategy('random')}
              className={cn(
                'rounded-lg px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 border',
                searchStrategy === 'random'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-600'
              )}
            >
              <Shuffle className="h-4 w-4" />
              {t('recipe.randomStrategy')}
            </button>
            <button
              onClick={() => setSearchStrategy('expiring')}
              className={cn(
                'rounded-lg px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 border',
                searchStrategy === 'expiring'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-600'
              )}
            >
              <Timer className="h-4 w-4" />
              {t('recipe.expiringStrategy')}
              {expiringCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{expiringCount}</span>
              )}
            </button>
          </div>

          <Button
            onClick={() => searchExternalRecipes(false)}
            disabled={externalLoading || ingredients.length === 0}
            className="w-full"
          >
            {externalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('recipe.searching')}
              </>
            ) : (
              <>
                {!isPremium && <Crown className="mr-2 h-4 w-4" />}
                {isPremium && (searchStrategy === 'expiring' ? <Timer className="mr-2 h-4 w-4" /> : <Shuffle className="mr-2 h-4 w-4" />)}
                {t('recipe.searchByIngredients')}
              </>
            )}
          </Button>

          {ingredients.length === 0 && (
            <p className="mt-3 text-center text-sm text-gray-500">{t('fridge.empty')}</p>
          )}

          {externalError && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{externalError}</span>
            </div>
          )}

          {externalQuery && externalRecipes.length > 0 && (
            <p className="mt-3 text-center text-sm text-gray-500">
              {t('recipe.searchQuery', { query: externalQuery.replace(/,/g, ', ') })}
            </p>
          )}

          {externalRecipes.length > 0 && (
            <>
              {/* Source Filter */}
              <div className="mt-4 flex gap-2 justify-center">
                {(['all', 'youtube', 'google'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setExternalFilter(f)}
                    disabled={f !== 'all' && !!apiStatus && !apiStatus[f as 'youtube' | 'google']}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      externalFilter === f
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300',
                      f !== 'all' && apiStatus && !apiStatus[f as 'youtube' | 'google'] && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {f === 'all' ? t('fridge.all') : t(`recipe.${f}`)}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="mt-4 space-y-3">
                {filteredExternalRecipes.map((recipe) => (
                  <a
                    key={recipe.id}
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="transition-transform hover:scale-[1.01] overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          {recipe.thumbnail && (
                            <div className="relative h-24 w-32 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={recipe.thumbnail}
                                alt={recipe.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-3 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-2">{recipe.title}</h4>
                                {recipe.snippet && (
                                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{recipe.snippet}</p>
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge
                                variant={recipe.source === 'youtube' ? 'danger' : 'info'}
                                className="text-xs"
                              >
                                {recipe.source === 'youtube' ? (
                                  <span className="flex items-center gap-1">
                                    <Youtube className="h-3 w-3" />
                                    YouTube
                                  </span>
                                ) : (
                                  'Google'
                                )}
                              </Badge>
                              {recipe.channelName && (
                                <span className="text-xs text-gray-500 truncate">{recipe.channelName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}

                {filteredExternalRecipes.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">{t('recipe.noExternalResults')}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

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

      {/* Premium Gate Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="external_recipe_search"
      />
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
