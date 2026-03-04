'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wand2, Crown, ChefHat, Loader2, RotateCcw, Clock, Search, ExternalLink, Heart, Check, Share2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/useToastStore';
import { aiGenerateRecipe, saveAiRecipe as saveAiRecipeApi } from '@/lib/api/recipes';
import { addFavorite } from '@/lib/api/favorites';
import { captureElementAsImage, shareImage } from '@/lib/shareImage';
import type { AIGeneratedRecipe } from './types';
import { RecipeShareCard } from './RecipeShareCard';
import { getSearchUrl, getDifficultyLabel, getDifficultyColor } from './utils';

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
  const shareCardRef = useRef<HTMLDivElement>(null);

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ingredients.map(i => i.id)));
    }
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addDebug = (msg: string) => setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

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
      }) as { recipe?: AIGeneratedRecipe; freeTrial?: { remainingCount: number; limit: number }; error?: string };

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
    if (!recipe || saving || saved) {
      addDebug(`save blocked: recipe=${!!recipe}, saving=${saving}, saved=${saved}`);
      return;
    }

    setSaving(true);
    addDebug('save: start');
    try {
      const result = await saveAiRecipeApi({ ...recipe, locale });
      addDebug(`saveAiRecipeApi result: id=${result?.id}`);
      if (result?.id) {
        await addFavorite(result.id);
        addDebug(`addFavorite done: ${result.id}`);
        toggleFavorite(result.id);
        setSavedRecipeId(result.id);
        setSaved(true);
        toast.success(t('recommend.saved'));
        addDebug('save: SUCCESS');
      } else {
        addDebug('save: result.id is falsy');
        toast.error(t('recommend.saveError'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addDebug(`save ERROR: ${msg}`);
      toast.error(t('recommend.saveError'));
    } finally {
      setSaving(false);
    }
  }, [recipe, saving, saved, locale, toggleFavorite]);

  const handleShare = useCallback(async () => {
    if (!recipe || !shareCardRef.current) return;
    addDebug('handleShare: capturing image');

    // 저장 안 된 레시피면 자동 저장
    if (!saved && !saving) {
      try {
        setSaving(true);
        addDebug('handleShare: auto-saving');
        const result = await saveAiRecipeApi({ ...recipe, locale });
        if (result?.id) {
          await addFavorite(result.id);
          toggleFavorite(result.id);
          setSavedRecipeId(result.id);
          setSaved(true);
          addDebug(`handleShare: auto-save SUCCESS id=${result.id}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addDebug(`handleShare auto-save ERROR: ${msg}`);
      } finally {
        setSaving(false);
      }
    }

    try {
      const file = await captureElementAsImage(
        shareCardRef.current,
        `mealkeeper-${recipe.title.slice(0, 20)}.png`
      );
      addDebug(`image captured: ${(file.size / 1024).toFixed(1)}KB`);
      const shared = await shareImage(file, recipe.title);
      if (shared) {
        toast.success(t('share.linkCopied'));
      }
      addDebug('share done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addDebug(`share image ERROR: ${msg}`);
      toast.error(t('recommend.saveError'));
    }
  }, [recipe, saved, saving, locale, toggleFavorite]);

  const handleCookingTimeChange = (value: string) => {
    const valid = COOKING_TIME_VALUES.includes(value as CookingTime);
    setPreferences(p => ({ ...p, cookingTime: valid ? (value as CookingTime) : '' }));
  };

  const handleDifficultyChange = (value: string) => {
    const valid = DIFFICULTY_VALUES.includes(value as Difficulty);
    setPreferences(p => ({ ...p, difficulty: valid ? (value as Difficulty) : '' }));
  };

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
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-400">
                {t('recommend.noIngredients')}
              </p>
              <p className="mt-1 text-sm text-gray-500">{t('recommend.addIngredientsFirst')}</p>
              <Button onClick={() => router.push(`/${locale}/fridge`)} className="mt-4">
                {t('recommend.goToFridge')}
              </Button>
            </div>
          ) : (
            <>
              {/* My Ingredients - Selectable */}
              <div className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {t('recommend.myIngredients', { count: ingredients.length })}
                    <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                      ({t('recommend.selectedCount', { selected: selectedCount, total: ingredients.length })})
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {allSelected ? t('recommend.deselectAll') : t('recommend.selectAll')}
                  </button>
                </div>
                <p className="mb-2 text-xs text-gray-400">{t('recommend.selectIngredients')}</p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing) => {
                      const isSelected = selectedIds.has(ing.id);
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => toggleIngredient(ing.id)}
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                            isSelected
                              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-600'
                              : 'bg-gray-100 text-gray-400 line-through dark:bg-gray-700 dark:text-gray-500'
                          )}
                        >
                          {ing.name}
                        </button>
                      );
                    })}
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
                    onChange={(e) => handleCookingTimeChange(e.target.value)}
                    options={[
                      { value: '', label: t('recommend.cookingTimeLabel') },
                      { value: 'quick', label: t('recommend.quick') },
                      { value: 'medium', label: t('recommend.medium') },
                      { value: 'long', label: t('recommend.long') },
                    ]}
                  />
                  <Select
                    value={preferences.difficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value)}
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

              {/* Generate Button */}
              <Button onClick={generate} disabled={loading || selectedCount === 0} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('recommend.generating')}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    {t('recommend.generate')}
                  </>
                )}
              </Button>
            </>
          )}

          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* Hidden share card for image capture */}
      {recipe && <RecipeShareCard ref={shareCardRef} recipe={recipe} locale={locale} />}

      {/* AI Generated Recipe */}
      {recipe && (
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
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={save}
                  disabled={saving || saved}
                  variant={saved ? 'primary' : 'outline'}
                  size="sm"
                  className={cn(saved && 'bg-red-500 hover:bg-red-500 text-white')}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Heart className="mr-1.5 h-4 w-4" />
                  )}
                  {saved ? t('recommend.saved') : t('recommend.saveToFavorites')}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="mr-1.5 h-4 w-4" />
                  {t('share.shareRecipe')}
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

            {/* Debug Panel */}
            <div className="mt-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-700">DEBUG</span>
                <button type="button" onClick={() => setDebugLog([])} className="text-xs text-yellow-600 underline">Clear</button>
              </div>
              <p className="text-[10px] text-gray-500">
                saved={String(saved)} | savedRecipeId={savedRecipeId ?? 'null'} | saving={String(saving)}
              </p>
              {debugLog.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto">
                  {debugLog.map((log, idx) => (
                    <p key={idx} className="break-all text-[10px] text-yellow-800 dark:text-yellow-300">{log}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {recipe && (
          <Button variant="outline" onClick={generate} disabled={loading} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('recommend.generateAnother')}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => { onBack(); reset(); }}
          className={recipe ? 'flex-1' : 'w-full'}
        >
          {t('recommend.backToSelect')}
        </Button>
      </div>
    </div>
  );
}
