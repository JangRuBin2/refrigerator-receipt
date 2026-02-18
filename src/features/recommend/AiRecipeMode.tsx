'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wand2, Crown, ChefHat, Loader2, RotateCcw, Clock, Search, ExternalLink, Heart, Check } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { aiGenerateRecipe, saveAiRecipe as saveAiRecipeApi } from '@/lib/api/recipes';
import type { AIGeneratedRecipe } from './types';
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
  const { ingredients } = useStore();

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

  const generate = useCallback(async () => {
    if (ingredients.length === 0) return;

    setLoading(true);
    setError('');
    setRecipe(null);
    setSaved(false);

    try {
      const ingredientNames = ingredients.map(i => i.name);
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
      setError(err instanceof Error ? err.message : 'AI 레시피 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [ingredients, locale, preferences]);

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
      await saveAiRecipeApi({ ...recipe, locale });
      setSaved(true);
    } catch {
      setError('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }, [recipe, saving, saved, locale]);

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
          AI 맞춤 레시피
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
              <h2 className="text-xl font-bold">AI 맞춤 레시피</h2>
              <p className="text-sm text-gray-500">내 냉장고 재료로 새로운 레시피 생성</p>
            </div>
          </div>

          {ingredients.length === 0 ? (
            <div className="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
              <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-400">
                냉장고에 재료가 없어요
              </p>
              <p className="mt-1 text-sm text-gray-500">먼저 재료를 등록해주세요</p>
              <Button onClick={() => router.push(`/${locale}/fridge`)} className="mt-4">
                냉장고로 이동
              </Button>
            </div>
          ) : (
            <>
              {/* My Ingredients */}
              <div className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
                <p className="mb-2 text-sm font-medium text-gray-500">내 냉장고 재료 ({ingredients.length}개)</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.slice(0, 10).map((ing) => (
                    <Badge key={ing.id} variant="default" className="text-xs">{ing.name}</Badge>
                  ))}
                  {ingredients.length > 10 && (
                    <Badge variant="default" className="text-xs">+{ingredients.length - 10}</Badge>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="mb-4 space-y-3 rounded-lg bg-white p-4 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500">선호도 설정 (선택)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={preferences.cookingTime}
                    onChange={(e) => handleCookingTimeChange(e.target.value)}
                    options={[
                      { value: '', label: '조리 시간' },
                      { value: 'quick', label: '15분 이내' },
                      { value: 'medium', label: '30분 이내' },
                      { value: 'long', label: '60분 이상' },
                    ]}
                  />
                  <Select
                    value={preferences.difficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value)}
                    options={[
                      { value: '', label: '난이도' },
                      { value: 'easy', label: '쉬움' },
                      { value: 'medium', label: '보통' },
                      { value: 'hard', label: '어려움' },
                    ]}
                  />
                </div>
                <Select
                  value={preferences.cuisine}
                  onChange={(e) => setPreferences(p => ({ ...p, cuisine: e.target.value }))}
                  options={[
                    { value: '', label: '요리 종류' },
                    { value: '한식', label: '한식' },
                    { value: '중식', label: '중식' },
                    { value: '일식', label: '일식' },
                    { value: '양식', label: '양식' },
                    { value: '분식', label: '분식' },
                    { value: '아시안', label: '아시안' },
                  ]}
                />
              </div>

              {/* Generate Button */}
              <Button onClick={generate} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI가 레시피를 만들고 있어요...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    AI 레시피 생성하기
                  </>
                )}
              </Button>
            </>
          )}

          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* AI Generated Recipe */}
      {recipe && (
        <Card className="overflow-hidden ring-2 ring-emerald-500 shadow-lg">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">AI가 만든 레시피</span>
            </div>

            <h3 className="text-xl font-bold">{recipe.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{recipe.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {recipe.cookingTime}분
              </span>
              <Badge className={getDifficultyColor(recipe.difficulty)}>
                {getDifficultyLabel(recipe.difficulty, locale)}
              </Badge>
              <Badge variant="default" className="text-xs">{recipe.servings}인분</Badge>
            </div>

            {/* Ingredients */}
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">재료</h4>
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
              <h4 className="mb-2 font-semibold">조리 방법</h4>
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
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">💡 팁: </span>
                  <span className="text-emerald-600 dark:text-emerald-300">{recipe.tips}</span>
                </p>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('common.aiDisclaimer')}
            </p>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-3">
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
                {saved ? '저장됨' : '즐겨찾기에 저장'}
              </Button>
              <a
                href={getSearchUrl(recipe.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Search className="h-4 w-4" />
                유튜브 검색
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {recipe && (
          <Button variant="outline" onClick={generate} disabled={loading} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            다른 레시피 생성
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => { onBack(); reset(); }}
          className={recipe ? 'flex-1' : 'w-full'}
        >
          처음으로
        </Button>
      </div>
    </div>
  );
}
