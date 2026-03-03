'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wand2, ChefHat, Clock, Loader2, RotateCcw, Crown, Heart, Check, Search, ExternalLink } from 'lucide-react';
import { z } from 'zod';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { getDifficultyColor, getDifficultyLabel } from '@/lib/constants';
import { aiGenerateRecipe, saveAiRecipe as saveAiRecipeApi } from '@/lib/api/recipes';
import { addFavorite } from '@/lib/api/favorites';
import { useStore } from '@/store/useStore';

const aiGenerateResponseSchema = z.object({
  recipe: z.object({
    title: z.string(),
    description: z.string(),
    cookingTime: z.number(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    servings: z.number(),
    ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
    instructions: z.array(z.string()),
    tips: z.string().optional(),
  }).optional(),
  freeTrial: z.object({ remainingCount: z.number(), limit: z.number() }).optional(),
  error: z.string().optional(),
});

type AIGeneratedRecipe = NonNullable<z.infer<typeof aiGenerateResponseSchema>['recipe']>;

interface AiModeProps {
  locale: string;
  isPremium: boolean;
  onBack: () => void;
  onFreeTrialUpdate: (info: { remainingCount: number; limit: number }) => void;
}

function getSearchUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' 레시피')}`;
}

export function AiMode({ locale, isPremium, onBack, onFreeTrialUpdate }: AiModeProps) {
  const t = useTranslations();
  const router = useRouter();
  const { ingredients, toggleFavorite } = useStore();

  const [aiRecipe, setAiRecipe] = useState<AIGeneratedRecipe | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPreferences, setAiPreferences] = useState({
    cookingTime: '' as '' | 'quick' | 'medium' | 'long',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    cuisine: '',
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  const getLocalizedDifficultyLabel = (d?: string) => getDifficultyLabel(d, locale);

  const generateAiRecipe = async () => {
    if (ingredients.length === 0) return;

    setAiLoading(true);
    setAiError('');
    setAiRecipe(null);
    setAiSaved(false);

    try {
      const ingredientNames = ingredients.map(i => i.name);
      const preferences: Record<string, unknown> = {};

      if (aiPreferences.cookingTime) {
        preferences.cookingTime = aiPreferences.cookingTime;
      }
      if (aiPreferences.difficulty) {
        preferences.difficulty = aiPreferences.difficulty;
      }
      if (aiPreferences.cuisine) {
        preferences.cuisine = aiPreferences.cuisine;
      }

      const raw = await aiGenerateRecipe({
        ingredients: ingredientNames,
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
        locale,
      });
      const data = aiGenerateResponseSchema.parse(raw);

      setAiRecipe(data.recipe ?? null);

      if (data.freeTrial) {
        onFreeTrialUpdate(data.freeTrial);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : t('recommend.aiGenerateError'));
    } finally {
      setAiLoading(false);
    }
  };

  const resetAi = () => {
    setAiRecipe(null);
    setAiError('');
    setAiPreferences({ cookingTime: '', difficulty: '', cuisine: '' });
    setAiSaved(false);
  };

  const saveRecipe = async () => {
    if (!aiRecipe || aiSaving || aiSaved) return;

    setAiSaving(true);
    try {
      const saved = await saveAiRecipeApi({ ...aiRecipe, locale });
      if (saved?.id) {
        await addFavorite(saved.id);
        toggleFavorite(saved.id);
      }
      setAiSaved(true);
    } catch {
      setAiError(t('recommend.saveError'));
    } finally {
      setAiSaving(false);
    }
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
              <p className="mt-1 text-sm text-gray-500">
                {t('recommend.addIngredientsFirst')}
              </p>
              <Button
                onClick={() => router.push(`/${locale}/fridge`)}
                className="mt-4"
              >
                {t('recommend.goToFridge')}
              </Button>
            </div>
          ) : (
            <>
              {/* My Ingredients */}
              <div className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  {t('recommend.myIngredients', { count: ingredients.length })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.slice(0, 10).map((ing) => (
                    <Badge key={ing.id} variant="default" className="text-xs">
                      {ing.name}
                    </Badge>
                  ))}
                  {ingredients.length > 10 && (
                    <Badge variant="default" className="text-xs">
                      +{ingredients.length - 10}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="mb-4 space-y-3 rounded-lg bg-white p-4 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500">{t('recommend.preferences')}</p>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={aiPreferences.cookingTime}
                    onChange={(e) => setAiPreferences(p => ({ ...p, cookingTime: e.target.value as typeof p.cookingTime }))}
                    options={[
                      { value: '', label: t('recommend.cookingTimeLabel') },
                      { value: 'quick', label: t('recommend.quick') },
                      { value: 'medium', label: t('recommend.medium') },
                      { value: 'long', label: t('recommend.long') },
                    ]}
                  />
                  <Select
                    value={aiPreferences.difficulty}
                    onChange={(e) => setAiPreferences(p => ({ ...p, difficulty: e.target.value as typeof p.difficulty }))}
                    options={[
                      { value: '', label: t('recommend.difficultyLabel') },
                      { value: 'easy', label: t('recommend.easy') },
                      { value: 'medium', label: t('recommend.normal') },
                      { value: 'hard', label: t('recommend.hard') },
                    ]}
                  />
                </div>

                <Select
                  value={aiPreferences.cuisine}
                  onChange={(e) => setAiPreferences(p => ({ ...p, cuisine: e.target.value }))}
                  options={[
                    { value: '', label: t('recommend.cuisineLabel') },
                    { value: '한식', label: t('recommend.korean') },
                    { value: '중식', label: t('recommend.chinese') },
                    { value: '일식', label: t('recommend.japanese') },
                    { value: '양식', label: t('recommend.western') },
                    { value: '분식', label: t('recommend.snack') },
                    { value: '아시안', label: t('recommend.asian') },
                  ]}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateAiRecipe}
                disabled={aiLoading}
                className="w-full"
                size="lg"
              >
                {aiLoading ? (
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

          {aiError && (
            <p className="mt-3 text-center text-sm text-red-500">{aiError}</p>
          )}
        </CardContent>
      </Card>

      {/* AI Generated Recipe */}
      {aiRecipe && (
        <Card className="overflow-hidden ring-2 ring-emerald-500 shadow-lg">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">{t('recommend.aiGenerated')}</span>
            </div>

            <h3 className="text-xl font-bold">{aiRecipe.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{aiRecipe.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {t('recommend.cookingTime', { time: aiRecipe.cookingTime })}
              </span>
              <Badge className={getDifficultyColor(aiRecipe.difficulty)}>
                {getLocalizedDifficultyLabel(aiRecipe.difficulty)}
              </Badge>
              <Badge variant="default" className="text-xs">
                {t('recommend.servings', { count: aiRecipe.servings })}
              </Badge>
            </div>

            {/* Ingredients */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">{t('recipe.ingredients')}</h4>
              <div className="space-y-1">
                {aiRecipe.ingredients.map((ing, idx) => (
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
                {aiRecipe.instructions.map((step, idx) => (
                  <li key={idx} className="text-gray-600 dark:text-gray-400">
                    {step.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {aiRecipe.tips && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-sm">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{t('recommend.tip')}: </span>
                  <span className="text-emerald-600 dark:text-emerald-300">{aiRecipe.tips}</span>
                </p>
              </div>
            )}

            {/* AI Disclaimer */}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('common.aiDisclaimer')}
            </p>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={saveRecipe}
                disabled={aiSaving || aiSaved}
                variant={aiSaved ? 'primary' : 'outline'}
                size="sm"
                className={cn(
                  aiSaved && 'bg-red-500 hover:bg-red-500 text-white'
                )}
              >
                {aiSaving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : aiSaved ? (
                  <Check className="mr-1.5 h-4 w-4" />
                ) : (
                  <Heart className="mr-1.5 h-4 w-4" />
                )}
                {aiSaved ? t('recommend.saved') : t('recommend.saveToFavorites')}
              </Button>
              <a
                href={getSearchUrl(aiRecipe.title)}
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
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {aiRecipe && (
          <Button
            variant="outline"
            onClick={generateAiRecipe}
            disabled={aiLoading}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('recommend.generateAnother')}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => { onBack(); resetAi(); }}
          className={aiRecipe ? 'flex-1' : 'w-full'}
        >
          {t('recommend.backToSelect')}
        </Button>
      </div>
    </div>
  );
}
