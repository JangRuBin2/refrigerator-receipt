'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wand2, Crown, ChefHat, Loader2, RotateCcw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { aiGenerateRecipe, saveAiRecipe as saveAiRecipeApi } from '@/lib/api/recipes';
import { addFavorite } from '@/lib/api/favorites';
import { renderRecipeToImage, shareImage, saveImageToDevice } from '@/lib/shareImage';
import { shareTossRecipeLink, isTossEnvironment } from '@/lib/tossShare';
import type { AIGeneratedRecipe } from './types';
import { RecipeResult } from './RecipeResult';

interface AiRecipeModeProps {
  locale: string;
  isPremium: boolean;
  onBack: () => void;
}

type CookingTime = '' | 'quick' | 'medium' | 'long';
type Difficulty = '' | 'easy' | 'medium' | 'hard';

const COOKING_TIME_VALUES: CookingTime[] = ['', 'quick', 'medium', 'long'];
const DIFFICULTY_VALUES: Difficulty[] = ['', 'easy', 'medium', 'hard'];

export function AiRecipeMode({ locale, isPremium, onBack }: AiRecipeModeProps) {
  const t = useTranslations();
  const router = useRouter();
  const { ingredients, toggleFavorite } = useStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(ingredients.map(i => i.id))
  );

  const allSelected = useMemo(
    () => ingredients.length > 0 && ingredients.every(i => selectedIds.has(i.id)),
    [ingredients, selectedIds]
  );

  const selectedCount = useMemo(
    () => ingredients.filter(i => selectedIds.has(i.id)).length,
    [ingredients, selectedIds]
  );

  const toggleIngredient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(ingredients.map(i => i.id)));
  };

  const [recipe, setRecipe] = useState<AIGeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState({
    cookingTime: '' as CookingTime,
    difficulty: '' as Difficulty,
    cuisine: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    setError('');
    setRecipe(null);
    setSaved(false);
    setSavedRecipeId(null);

    try {
      const ingredientNames = ingredients
        .filter(i => selectedIds.has(i.id))
        .map(i => i.name);
      const prefs: Record<string, unknown> = {};
      if (preferences.cookingTime) prefs.cookingTime = preferences.cookingTime;
      if (preferences.difficulty) prefs.difficulty = preferences.difficulty;
      if (preferences.cuisine) prefs.cuisine = preferences.cuisine;

      const data = await aiGenerateRecipe({
        ingredients: ingredientNames,
        preferences: Object.keys(prefs).length > 0 ? prefs : undefined,
        locale,
      }) as { recipe?: AIGeneratedRecipe };

      setRecipe(data.recipe || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recommend.aiGenerateError'));
    } finally {
      setLoading(false);
    }
  }, [ingredients, selectedIds, selectedCount, locale, preferences]);

  const reset = useCallback(() => {
    setRecipe(null);
    setError('');
    setPreferences({ cookingTime: '', difficulty: '', cuisine: '' });
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    if (!recipe || saving || saved) return;
    setSaving(true);
    try {
      const result = await saveAiRecipeApi({ ...recipe, locale });
      if (result?.id) {
        await addFavorite(result.id);
        toggleFavorite(result.id);
        setSavedRecipeId(result.id);
        setSaved(true);
        toast.success(t('recommend.saved'));
      } else {
        toast.error(t('recommend.saveError'));
      }
    } catch {
      toast.error(t('recommend.saveError'));
    } finally {
      setSaving(false);
    }
  }, [recipe, saving, saved, locale, toggleFavorite]);

  const autoSaveIfNeeded = useCallback(async (): Promise<string | null> => {
    if (saved && savedRecipeId) return savedRecipeId;
    if (!recipe || saving) return savedRecipeId;
    try {
      setSaving(true);
      const result = await saveAiRecipeApi({ ...recipe, locale });
      if (result?.id) {
        await addFavorite(result.id);
        toggleFavorite(result.id);
        setSavedRecipeId(result.id);
        setSaved(true);
        return result.id;
      }
    } catch {
      // auto-save failed silently
    } finally {
      setSaving(false);
    }
    return savedRecipeId;
  }, [recipe, saved, saving, savedRecipeId, locale, toggleFavorite]);

  const handleSaveImage = useCallback(async () => {
    if (!recipe) return;
    try {
      const file = await renderRecipeToImage(recipe, locale, `mealkeeper-${recipe.title.slice(0, 20)}.png`);
      await saveImageToDevice(file);
      toast.success(t('share.imageSaved'));
    } catch {
      toast.error(t('recommend.saveError'));
    }
  }, [recipe, locale]);

  const handleShare = useCallback(async () => {
    if (!recipe) return;
    const recipeId = await autoSaveIfNeeded();
    if (!recipeId) { toast.error(t('recommend.saveError')); return; }

    try {
      const result = await shareTossRecipeLink(recipeId, locale, recipe.title);
      if (result === 'copied') toast.success(t('share.linkCopied'));
    } catch {
      // Toss/Web Share 실패 시 이미지 공유 fallback
      try {
        const file = await renderRecipeToImage(recipe, locale, `mealkeeper-${recipe.title.slice(0, 20)}.png`);
        const shared = await shareImage(file, recipe.title);
        if (shared) toast.success(t('share.linkCopied'));
      } catch {
        toast.error(t('recommend.saveError'));
      }
    }
  }, [recipe, autoSaveIfNeeded, locale]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Wand2 className="mr-1 h-3 w-3" />
          {t('recommend.aiMode')}
        </Badge>
        {!isPremium && (
          <Badge variant="warning" className="text-xs">
            <Crown className="mr-1 h-3 w-3" />
            Premium
          </Badge>
        )}
      </div>

      <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <Wand2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('recommend.aiMode')}</h2>
              <p className="text-sm text-gray-500">{t('recommend.aiDescription')}</p>
            </div>
          </div>

          {ingredients.length === 0 ? (
            <div className="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
              <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-400">{t('recommend.noIngredients')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('recommend.addIngredientsFirst')}</p>
              <Button onClick={() => router.push(`/${locale}/fridge`)} className="mt-4">
                {t('recommend.goToFridge')}
              </Button>
            </div>
          ) : (
            <>
              {/* Ingredient Selection */}
              <div className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {t('recommend.myIngredients', { count: ingredients.length })}
                    <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                      ({t('recommend.selectedCount', { selected: selectedCount, total: ingredients.length })})
                    </span>
                  </p>
                  <button type="button" onClick={toggleAll} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                    {allSelected ? t('recommend.deselectAll') : t('recommend.selectAll')}
                  </button>
                </div>
                <p className="mb-2 text-xs text-gray-400">{t('recommend.selectIngredients')}</p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing) => (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => toggleIngredient(ing.id)}
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                          selectedIds.has(ing.id)
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-600'
                            : 'bg-gray-100 text-gray-400 line-through dark:bg-gray-700 dark:text-gray-500'
                        )}
                      >
                        {ing.name}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedCount === 0 && (
                  <p className="mt-2 text-xs text-red-500">{t('recommend.noIngredientsSelected')}</p>
                )}
              </div>

              {/* Preferences */}
              <div className="mb-4 space-y-3 rounded-lg bg-white p-4 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500">{t('recommend.preferences')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={preferences.cookingTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPreferences(p => ({ ...p, cookingTime: COOKING_TIME_VALUES.includes(v as CookingTime) ? (v as CookingTime) : '' }));
                    }}
                    options={[
                      { value: '', label: t('recommend.cookingTimeLabel') },
                      { value: 'quick', label: t('recommend.quick') },
                      { value: 'medium', label: t('recommend.medium') },
                      { value: 'long', label: t('recommend.long') },
                    ]}
                  />
                  <Select
                    value={preferences.difficulty}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPreferences(p => ({ ...p, difficulty: DIFFICULTY_VALUES.includes(v as Difficulty) ? (v as Difficulty) : '' }));
                    }}
                    options={[
                      { value: '', label: t('recommend.difficultyLabel') },
                      { value: 'easy', label: t('recommend.easy') },
                      { value: 'medium', label: t('recommend.normal') },
                      { value: 'hard', label: t('recommend.hard') },
                    ]}
                  />
                </div>
                <Select
                  value={preferences.cuisine}
                  onChange={(e) => setPreferences(p => ({ ...p, cuisine: e.target.value }))}
                  options={[
                    { value: '', label: t('recommend.cuisineLabel') },
                    { value: 'korean', label: t('recommend.korean') },
                    { value: 'chinese', label: t('recommend.chinese') },
                    { value: 'japanese', label: t('recommend.japanese') },
                    { value: 'western', label: t('recommend.western') },
                    { value: 'snack', label: t('recommend.snack') },
                    { value: 'asian', label: t('recommend.asian') },
                  ]}
                />
              </div>

              <Button onClick={generate} disabled={loading || selectedCount === 0} className="w-full" size="lg">
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t('recommend.generating')}</>
                ) : (
                  <><Wand2 className="mr-2 h-5 w-5" />{t('recommend.generate')}</>
                )}
              </Button>
            </>
          )}

          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {recipe && (
        <RecipeResult
          recipe={recipe}
          locale={locale}
          saving={saving}
          saved={saved}
          onSave={save}
          onSaveImage={handleSaveImage}
          onShare={handleShare}
        />
      )}

      <div className="flex gap-2">
        {recipe && (
          <Button variant="outline" onClick={generate} disabled={loading} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('recommend.generateAnother')}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => { onBack(); reset(); }}
          className={recipe ? 'flex-1' : 'w-full'}
        >
          {t('recommend.backToSelect')}
        </Button>
      </div>
    </div>
  );
}
