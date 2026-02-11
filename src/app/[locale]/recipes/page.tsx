'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { ChefHat, Clock, Heart, Shuffle, Check, X, Loader2, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { cn } from '@/lib/utils';
import { getRecipes } from '@/lib/api/recipes';
import { searchRecipes as searchExternalRecipesApi } from '@/lib/api/recipes';
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
  const [freeTrialInfo, setFreeTrialInfo] = useState<{ remainingCount: number; limit: number } | null>(null);
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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid re-creating IntersectionObserver on every state change
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  // Fetch recipes from DB with pagination
  const fetchRecipes = useCallback(async (currentOffset: number, append = false) => {
    // Prevent duplicate fetches
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      if (!append) {
        setRecipesLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getRecipes({ limit: RECIPES_PER_PAGE, offset: currentOffset });
      const mappedRecipes = (data.recipes || []).map(mapDBRecipeToRecipe);

      if (append) {
        setRecipes(prev => [...prev, ...mappedRecipes]);
      } else {
        setRecipes(mappedRecipes);
      }

      // Check if there are more recipes to load
      const total = data.total || 0;
      const newHasMore = currentOffset + mappedRecipes.length < total;
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

  // Initial fetch
  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    loadingRef.current = false;
    fetchRecipes(0);
  }, [fetchRecipes]);

  // Infinite scroll with IntersectionObserver
  // Use refs to prevent observer re-creation and avoid fetching all data at once
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
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchRecipes]);

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
    setExternalLoading(true);
    setExternalError('');
    setExternalRecipes([]);

    try {
      const query = useCustomQuery && customSearchQuery.trim()
        ? customSearchQuery.trim()
        : ingredients.map(i => i.name).join(',');

      const data = await searchExternalRecipesApi(query, locale) as {
        results?: ExternalRecipe[];
        query?: string;
        apiStatus?: { youtube: boolean; google: boolean };
        freeTrial?: { remainingCount: number; limit: number };
      };

      // API 상태 저장
      if (data.apiStatus) {
        setApiStatus(data.apiStatus);
      }

      setExternalRecipes(data.results || []);
      setExternalQuery(data.query || '');

      // 무료 체험 정보 업데이트
      if (data.freeTrial) {
        setFreeTrialInfo(data.freeTrial);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('403')) {
        setShowPremiumModal(true);
      } else {
        setExternalError(t('common.error'));
      }
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

      {/* External Recipe Search Section - 준비 중 */}
      <Card className="opacity-60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              {t('recipe.externalRecommend')}
            </h2>
            <Badge variant="default" className="text-xs">
              {t('common.comingSoon')}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            YouTube, Google에서 레시피를 검색할 수 있는 기능이 곧 추가됩니다.
          </p>
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
              {(selectedRecipe.instructions[locale] || selectedRecipe.instructions.en)?.length ? (
                <ol className="list-inside list-decimal space-y-2">
                  {(selectedRecipe.instructions[locale] || selectedRecipe.instructions.en)?.map(
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
    <PremiumGate feature="recipe_browsing">
      <div className="min-h-screen">
        <Header locale={locale} title={t('recipe.title')} />
        <Suspense fallback={<RecipesLoading />}>
          <RecipesContent />
        </Suspense>
      </div>
    </PremiumGate>
  );
}
