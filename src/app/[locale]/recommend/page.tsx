'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Shuffle, Sparkles, Clock, ChefHat, Loader2, RotateCcw, Search, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { tasteQuestions, type ScoredRecipe } from '@/lib/recommend/engine';

type Mode = 'select' | 'random' | 'taste';

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
  const locale = params.locale as string;

  const [mode, setMode] = useState<Mode>('select');

  // Random mode state
  const [randomResult, setRandomResult] = useState<RandomResult | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomAnimating, setRandomAnimating] = useState(false);
  const [randomDisplayName, setRandomDisplayName] = useState('');

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

    // 슬롯머신 애니메이션
    const dummyNames = [
      '김치찌개', '비빔밥', '불고기', '떡볶이', '삼겹살',
      '된장찌개', '잡채', '냉면', '칼국수', '제육볶음',
    ];
    let animCount = 0;
    const maxAnim = 15;
    const interval = setInterval(() => {
      setRandomDisplayName(dummyNames[Math.floor(Math.random() * dummyNames.length)]);
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
          </div>
        )}

        {/* Random Mode */}
        {mode === 'random' && (
          <div className="space-y-4">
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
      </div>
    </div>
  );
}
