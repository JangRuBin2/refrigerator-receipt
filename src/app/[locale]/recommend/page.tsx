'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Shuffle, Sparkles, Clock, ChefHat, Loader2, RotateCcw, Search, ExternalLink, Crown, Wand2, Heart, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { tasteQuestions, type ScoredRecipe } from '@/lib/recommend/engine';
import { usePremium } from '@/hooks/usePremium';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { useStore } from '@/store/useStore';

type Mode = 'select' | 'random' | 'taste' | 'ai';

interface AIGeneratedRecipe {
  title: string;
  description: string;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
  tips?: string;
}

interface RandomResult {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  cooking_time?: number;
  difficulty?: string;
  ingredients?: { name: string; quantity?: string }[];
  tags?: string[];
}

export default function RecommendPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { isPremium } = usePremium();
  const [freeTrialInfo, setFreeTrialInfo] = useState<{ remainingCount: number; limit: number } | null>(null);
  const { ingredients } = useStore();

  const [mode, setMode] = useState<Mode>('select');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Random mode state
  const [randomResult, setRandomResult] = useState<RandomResult | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomAnimating, setRandomAnimating] = useState(false);
  const [randomDisplayName, setRandomDisplayName] = useState('');
  const [recipeNames, setRecipeNames] = useState<string[]>([]);

  // AI mode state
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

  // Fetch recipe names for animation on mount
  useEffect(() => {
    const fetchRecipeNames = async () => {
      try {
        const response = await fetch('/api/recipes?limit=50');
        if (response.ok) {
          const data = await response.json();
          const names = data.recipes?.map((r: RandomResult) =>
            r.title?.[locale] || r.title?.ko || r.title?.en || ''
          ).filter(Boolean) || [];
          if (names.length > 0) {
            setRecipeNames(names);
          }
        }
      } catch {
        // Keep default names if fetch fails
      }
    };
    fetchRecipeNames();
  }, [locale]);

  // Taste mode state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tasteResults, setTasteResults] = useState<ScoredRecipe[]>([]);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // === Random Mode ===
  const spinRandom = async () => {
    setRandomLoading(true);
    setRandomAnimating(true);
    setRandomResult(null);

    // 슬롯머신 애니메이션 - DB에서 가져온 레시피 이름 사용
    const animNames = recipeNames.length > 0 ? recipeNames : [
      '김치찌개', '비빔밥', '불고기', '떡볶이', '삼겹살',
      '된장찌개', '잡채', '냉면', '칼국수', '제육볶음',
    ];
    let animCount = 0;
    const maxAnim = 15;
    const interval = setInterval(() => {
      setRandomDisplayName(animNames[Math.floor(Math.random() * animNames.length)]);
      animCount++;
      if (animCount >= maxAnim) {
        clearInterval(interval);
      }
    }, 100);

    try {
      const response = await fetch('/api/recipes/random');
      const data = await response.json();

      // 애니메이션이 끝날 때까지 대기
      await new Promise(resolve => setTimeout(resolve, maxAnim * 100 + 200));
      clearInterval(interval);

      if (response.ok) {
        setRandomResult(data);
        setRandomDisplayName(
          (data.title as Record<string, string>)?.[locale] ||
          (data.title as Record<string, string>)?.ko ||
          ''
        );
      }
    } catch {
      // error handled silently
    } finally {
      setRandomLoading(false);
      setRandomAnimating(false);
    }
  };

  // === Taste Mode ===
  const handleAnswer = (questionId: string, optionId: string) => {
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    if (currentStep < tasteQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 질문 → 결과 요청
      submitTaste(newAnswers);
    }
  };

  const submitTaste = async (finalAnswers: Record<string, string>) => {
    setTasteLoading(true);
    try {
      const response = await fetch('/api/recipes/taste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setTasteResults(data);
      }
    } catch {
      // error handled silently
    } finally {
      setTasteLoading(false);
      setShowResults(true);
    }
  };

  const resetTaste = () => {
    setCurrentStep(0);
    setAnswers({});
    setTasteResults([]);
    setShowResults(false);
  };

  const getTitle = (title: Record<string, string>) => title[locale] || title.ko || title.en || '';

  const getSearchUrl = (name: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' 레시피')}`;

  const getDifficultyLabel = (d?: string) => {
    if (!d) return '';
    const map: Record<string, Record<string, string>> = {
      easy: { ko: '쉬움', en: 'Easy', ja: '簡単', zh: '简单' },
      medium: { ko: '보통', en: 'Medium', ja: '普通', zh: '中等' },
      hard: { ko: '어려움', en: 'Hard', ja: '難しい', zh: '困难' },
    };
    return map[d]?.[locale] || map[d]?.ko || d;
  };

  const getDifficultyColor = (d?: string) => {
    if (d === 'easy') return 'bg-green-100 text-green-700';
    if (d === 'medium') return 'bg-yellow-100 text-yellow-700';
    if (d === 'hard') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // === AI Mode ===
  const handleAiModeClick = () => {
    // 재료가 없으면 냉장고로 이동 안내
    setMode('ai');
  };

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

      const response = await fetch('/api/recipes/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredientNames,
          preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // 무료 체험 소진 또는 프리미엄 필요
          setShowPremiumModal(true);
          if (data.freeTrial) {
            setFreeTrialInfo(data.freeTrial);
          }
          return;
        }
        throw new Error(data.error || 'Failed to generate recipe');
      }

      setAiRecipe(data.recipe);

      // 무료 체험 정보 업데이트
      if (data.freeTrial) {
        setFreeTrialInfo(data.freeTrial);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 레시피 생성에 실패했습니다');
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

  const saveAiRecipe = async () => {
    if (!aiRecipe || aiSaving || aiSaved) return;

    setAiSaving(true);
    try {
      const response = await fetch('/api/recipes/ai-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aiRecipe,
          locale,
        }),
      });

      if (response.ok || response.status === 409) {
        setAiSaved(true);
      } else {
        const data = await response.json();
        setAiError(data.error || '저장에 실패했습니다');
      }
    } catch {
      setAiError('저장에 실패했습니다');
    } finally {
      setAiSaving(false);
    }
  };

  // === Render: Recipe Card ===
  const renderRecipeCard = (recipe: RandomResult | ScoredRecipe, isBest = false) => {
    const title = getTitle(recipe.title);
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
                {getDifficultyLabel(recipe.difficulty)}
              </Badge>
            )}
          </div>

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {(recipe.ingredients as { name: string; quantity?: string }[]).slice(0, 6).map((ing, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {ing.name}
                  </Badge>
                ))}
                {(recipe.ingredients as { name: string; quantity?: string }[]).length > 6 && (
                  <Badge variant="default" className="text-xs">
                    +{(recipe.ingredients as { name: string; quantity?: string }[]).length - 6}
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
  };

  return (
    <div className="min-h-screen">
      <Header locale={locale} title={t('recommend.title')} />

      <div className="space-y-4 p-4">
        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer bg-gradient-to-br from-orange-50 to-red-50 transition-transform hover:scale-[1.02] dark:from-orange-900/20 dark:to-red-900/20"
              onClick={() => setMode('random')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Shuffle className="h-7 w-7 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('recommend.randomMode')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('recommend.randomDescription')}</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer bg-gradient-to-br from-purple-50 to-blue-50 transition-transform hover:scale-[1.02] dark:from-purple-900/20 dark:to-blue-900/20"
              onClick={() => setMode('taste')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Sparkles className="h-7 w-7 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{t('recommend.tasteMode')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('recommend.tasteDescription')}</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Recipe Mode */}
            <Card
              className="relative cursor-pointer bg-gradient-to-br from-emerald-50 to-cyan-50 transition-transform hover:scale-[1.02] dark:from-emerald-900/20 dark:to-cyan-900/20"
              onClick={handleAiModeClick}
            >
              {!isPremium && (
                <div className="absolute right-3 top-3">
                  <Badge variant="warning" className="text-xs">
                    <Crown className="mr-1 h-3 w-3" />
                    {freeTrialInfo && freeTrialInfo.remainingCount > 0
                      ? `${freeTrialInfo.remainingCount}회 무료`
                      : 'Premium'}
                  </Badge>
                </div>
              )}
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <Wand2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI 맞춤 레시피</h2>
                  <p className="mt-1 text-sm text-gray-500">내 냉장고 재료로 AI가 새로운 레시피를 만들어줘요</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Random Mode */}
        {mode === 'random' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                <Shuffle className="mr-1 h-3 w-3" />
                {t('recommend.randomMode')}
              </Badge>
            </div>
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardContent className="p-6 text-center">
                <h2 className="mb-4 text-xl font-bold">{t('recommend.randomTitle')}</h2>

                <div className={cn(
                  'mx-auto mb-6 flex h-28 w-full max-w-xs items-center justify-center rounded-2xl bg-white shadow-inner dark:bg-gray-800',
                  randomAnimating && 'animate-pulse'
                )}>
                  {randomDisplayName ? (
                    <span className={cn(
                      'text-2xl font-bold transition-all',
                      randomAnimating ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                    )}>
                      {randomDisplayName}
                    </span>
                  ) : (
                    <ChefHat className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                <Button
                  onClick={spinRandom}
                  disabled={randomLoading}
                  className="w-full max-w-xs"
                  size="lg"
                >
                  {randomLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('recommend.spinning')}
                    </>
                  ) : (
                    <>
                      <Shuffle className="mr-2 h-5 w-5" />
                      {t('recommend.spin')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {randomResult && !randomAnimating && renderRecipeCard(randomResult)}

            <Button
              variant="ghost"
              onClick={() => { setMode('select'); setRandomResult(null); setRandomDisplayName(''); }}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('recommend.retry')}
            </Button>
          </div>
        )}

        {/* Taste Mode */}
        {mode === 'taste' && !showResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Sparkles className="mr-1 h-3 w-3" />
                {t('recommend.tasteMode')}
              </Badge>
            </div>
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tasteQuestions.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-500">
                {t('recommend.stepOf', { current: currentStep + 1, total: tasteQuestions.length })}
              </span>
            </div>

            {/* Question Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="mb-6 text-xl font-bold">
                  {tasteQuestions[currentStep].question[locale] || tasteQuestions[currentStep].question.ko}
                </h2>

                <div className="space-y-3">
                  {tasteQuestions[currentStep].options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(tasteQuestions[currentStep].id, option.id)}
                      className={cn(
                        'w-full rounded-xl border-2 border-transparent bg-white px-5 py-4 text-left text-base font-medium shadow-sm transition-all hover:border-purple-300 hover:shadow-md active:scale-[0.98] dark:bg-gray-800 dark:hover:border-purple-600',
                        answers[tasteQuestions[currentStep].id] === option.id && 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      )}
                    >
                      {option.label[locale] || option.label.ko}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Back / Reset */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1"
                >
                  ← 이전
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => { setMode('select'); resetTaste(); }}
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('recommend.retry')}
              </Button>
            </div>
          </div>
        )}

        {/* Taste Results */}
        {mode === 'taste' && showResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <Sparkles className="mr-1 h-3 w-3" />
                {t('recommend.tasteMode')}
              </Badge>
            </div>
            <h2 className="text-lg font-bold">{t('recommend.result')}</h2>

            {tasteLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : tasteResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-500">{t('recommend.noResult')}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {renderRecipeCard(tasteResults[0], true)}

                {tasteResults.length > 1 && (
                  <>
                    <h3 className="mt-6 text-sm font-semibold text-gray-500">
                      {t('recommend.otherOptions')}
                    </h3>
                    <div className="space-y-3">
                      {tasteResults.slice(1).map((recipe) => (
                        <Card key={recipe.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{getTitle(recipe.title)}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  {recipe.cooking_time && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      {recipe.cooking_time}분
                                    </span>
                                  )}
                                  {recipe.difficulty && (
                                    <Badge className={cn('text-xs', getDifficultyColor(recipe.difficulty))}>
                                      {getDifficultyLabel(recipe.difficulty)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <a
                                href={getSearchUrl(getTitle(recipe.title))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full p-2 text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Search className="h-5 w-5" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <Button
              variant="outline"
              onClick={() => { resetTaste(); }}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('recommend.retry')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setMode('select'); resetTaste(); }}
              className="w-full"
            >
              처음으로
            </Button>
          </div>
        )}

        {/* AI Recipe Mode */}
        {mode === 'ai' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Wand2 className="mr-1 h-3 w-3" />
                AI 맞춤 레시피
              </Badge>
              {!isPremium && (
                <Badge variant="warning" className="text-xs">
                  <Crown className="mr-1 h-3 w-3" />
                  {freeTrialInfo && freeTrialInfo.remainingCount > 0
                    ? `${freeTrialInfo.remainingCount}회 무료`
                    : 'Premium'}
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

                {/* Ingredient Check */}
                {ingredients.length === 0 ? (
                  <div className="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
                    <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 font-medium text-gray-600 dark:text-gray-400">
                      냉장고에 재료가 없어요
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      먼저 재료를 등록해주세요
                    </p>
                    <Button
                      onClick={() => router.push(`/${locale}/fridge`)}
                      className="mt-4"
                    >
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
                      <p className="text-sm font-medium text-gray-500">선호도 설정 (선택)</p>

                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={aiPreferences.cookingTime}
                          onChange={(e) => setAiPreferences(p => ({ ...p, cookingTime: e.target.value as typeof p.cookingTime }))}
                          options={[
                            { value: '', label: '조리 시간' },
                            { value: 'quick', label: '15분 이내' },
                            { value: 'medium', label: '30분 이내' },
                            { value: 'long', label: '60분 이상' },
                          ]}
                        />
                        <Select
                          value={aiPreferences.difficulty}
                          onChange={(e) => setAiPreferences(p => ({ ...p, difficulty: e.target.value as typeof p.difficulty }))}
                          options={[
                            { value: '', label: '난이도' },
                            { value: 'easy', label: '쉬움' },
                            { value: 'medium', label: '보통' },
                            { value: 'hard', label: '어려움' },
                          ]}
                        />
                      </div>

                      <Select
                        value={aiPreferences.cuisine}
                        onChange={(e) => setAiPreferences(p => ({ ...p, cuisine: e.target.value }))}
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
                    <Button
                      onClick={generateAiRecipe}
                      disabled={aiLoading}
                      className="w-full"
                      size="lg"
                    >
                      {aiLoading ? (
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
                    <span className="text-sm font-medium text-emerald-600">AI가 만든 레시피</span>
                  </div>

                  <h3 className="text-xl font-bold">{aiRecipe.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{aiRecipe.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {aiRecipe.cookingTime}분
                    </span>
                    <Badge className={getDifficultyColor(aiRecipe.difficulty)}>
                      {getDifficultyLabel(aiRecipe.difficulty)}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      {aiRecipe.servings}인분
                    </Badge>
                  </div>

                  {/* Ingredients */}
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold">재료</h4>
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
                    <h4 className="mb-2 font-semibold">조리 방법</h4>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      {aiRecipe.instructions.map((step, idx) => (
                        <li key={idx} className="text-gray-600 dark:text-gray-400">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  {aiRecipe.tips && (
                    <div className="mt-4 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                      <p className="text-sm">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">💡 팁: </span>
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
                      onClick={saveAiRecipe}
                      disabled={aiSaving || aiSaved}
                      variant={aiSaved ? 'default' : 'outline'}
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
                      {aiSaved ? '저장됨' : '즐겨찾기에 저장'}
                    </Button>
                    <a
                      href={getSearchUrl(aiRecipe.title)}
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
              {aiRecipe && (
                <Button
                  variant="outline"
                  onClick={generateAiRecipe}
                  disabled={aiLoading}
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  다른 레시피 생성
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => { setMode('select'); resetAi(); }}
                className={aiRecipe ? 'flex-1' : 'w-full'}
              >
                처음으로
              </Button>
            </div>
          </div>
        )}

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature="ai_recipe"
        />
      </div>
    </div>
  );
}
